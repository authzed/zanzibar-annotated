import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ImageResponse } from 'next/og';
import path from 'path';
import { fragmentToRangeList } from '../../../components/lib/deeplinks';
import { getParsedPaperDOM } from '../../../util/parseddom';
import { getAssetUrl } from '../../../util/siteconfig';
import {
  getSelectionPreview,
  SelectionPreview,
  toWords,
  Word,
} from '../../../util/selectionpreview';

// Matches the dimensions of the social card column used by the paper layout.
const WIDTH = 428;
const HEIGHT = 225;
const PADDING = 8;
const FADE_HEIGHT = 32;

// Highlight color for the selected text.
const SELECTION_COLOR = '#b4d5fe';

const MAX_AGE = 31536000;
// The fallback is cached briefly so a transient failure isn't cached for long.
const FALLBACK_MAX_AGE = 3600;

let fontData: Buffer | undefined;

// The open source Times New Roman alternative used by the paper. It's read
// from disk rather than fetched from the deployment, which may be protected.
function loadFont(): Buffer {
  fontData ??= fs.readFileSync(
    path.join(process.cwd(), 'public/LinLibertine_R.ttf')
  );
  return fontData;
}

type Paragraph = { words: Word[]; isHeading: boolean };

function toParagraphs(preview: SelectionPreview): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  if (preview.previous) {
    paragraphs.push({
      words: toWords([[preview.previous.text, false]]),
      isHeading: preview.previous.isHeading,
    });
  }
  paragraphs.push({
    words: toWords([
      [preview.before, false],
      [preview.selected, true],
      [preview.after, false],
    ]),
    isHeading: preview.isHeading,
  });
  if (preview.next) {
    paragraphs.push({
      words: toWords([[preview.next.text, false]]),
      isHeading: preview.next.isHeading,
    });
  }
  return paragraphs;
}

// Sends the default preview image, which shows the top of the paper, when a
// selection preview can't be rendered.
function sendDefaultImage(res: NextApiResponse) {
  let image: Buffer;
  try {
    image = fs.readFileSync(path.join(process.cwd(), 'public/preview.png'));
  } catch (e) {
    // Fall back to the statically served copy of the image.
    console.error(e);
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(307, `${getAssetUrl()}/preview.png`);
  }
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', `s-maxage=${FALLBACK_MAX_AGE}`);
  res.send(image);
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ranges } = req.query;
  if (typeof ranges !== 'string' || !ranges.includes(':')) {
    return sendDefaultImage(res);
  }

  try {
    const image = await renderPreview(ranges);
    if (!image) {
      return sendDefaultImage(res);
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', `s-maxage=${MAX_AGE}`);
    res.send(image);
  } catch (e) {
    console.error(e);
    sendDefaultImage(res);
  }
};

// Renders the preview image for the given ranges, or returns null if the
// ranges don't resolve to a selection in the paper.
async function renderPreview(ranges: string): Promise<Buffer | null> {
  const dom = getParsedPaperDOM();

  let preview = null;
  try {
    preview = getSelectionPreview(
      fragmentToRangeList(dom.window.document, ranges)
    );
  } catch (e) {
    console.log(e);
  }
  if (!preview?.selected) {
    return null;
  }

  const image = new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: PADDING,
          backgroundColor: 'white',
          color: 'black',
          fontFamily: 'Linux Libertine',
          fontSize: 16,
          lineHeight: 1.35,
        }}
      >
        {toParagraphs(preview).map((paragraph, i) => (
          // Satori has no inline text flow, so wrap words as flex items.
          <div
            key={i}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              flexShrink: 0,
              marginTop: 6,
              marginBottom: 6,
              fontSize: paragraph.isHeading ? 21 : 16,
            }}
          >
            {paragraph.words.map((word, j) => (
              <span
                key={j}
                // Satori rejects undefined style values, so only set the
                // highlight on selected words.
                style={{
                  whiteSpace: 'pre',
                  ...(word.selected && { backgroundColor: SELECTION_COLOR }),
                }}
              >
                {word.text}
              </span>
            ))}
          </div>
        ))}
        {/* Fade out text clipped at the top and bottom edges. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: FADE_HEIGHT,
            backgroundImage: 'linear-gradient(to bottom, white, rgba(255, 255, 255, 0))',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: FADE_HEIGHT,
            backgroundImage: 'linear-gradient(to top, white, rgba(255, 255, 255, 0))',
          }}
        />
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        {
          name: 'Linux Libertine',
          data: loadFont(),
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );

  return Buffer.from(await image.arrayBuffer());
}

export default handler;
