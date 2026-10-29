import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ImageResponse } from 'next/og';
import path from 'path';
import { fragmentToRangeList } from '../../../components/lib/deeplinks';
import { getParsedPaperDOM } from '../../../util/parseddom';
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

let fontData: Promise<ArrayBuffer> | undefined;

// The open source Times New Roman alternative used by the paper, served from
// this deployment's public directory.
function loadFont(endpoint: string): Promise<ArrayBuffer> {
  if (!fontData) {
    fontData = fetch(`${endpoint}/LinLibertine_R.ttf`).then((res) => {
      if (!res.ok) {
        throw new Error(`failed to load font: ${res.status}`);
      }
      return res.arrayBuffer();
    });
    fontData.catch(() => {
      fontData = undefined;
    });
  }
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

function sendEmptyImage(res: NextApiResponse) {
  const filePath = path.resolve('.', 'assets/empty.png');
  const imageBuffer = fs.readFileSync(filePath);
  res.setHeader('Content-Type', 'image/png');
  res.send(imageBuffer);
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ranges } = req.query;
  if (typeof ranges !== 'string' || !ranges.includes(':')) {
    return sendEmptyImage(res);
  }

  let endpoint = process.env.PREVIEW_ENDPOINT;
  if (!endpoint) {
    endpoint = `https://${process.env.VERCEL_URL}`;
  }

  const dom = await getParsedPaperDOM(endpoint);

  let preview = null;
  try {
    preview = getSelectionPreview(
      fragmentToRangeList(dom.window.document, ranges)
    );
  } catch (e) {
    console.log(e);
  }
  if (!preview?.selected) {
    return sendEmptyImage(res);
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
          data: await loadFont(endpoint),
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', `s-maxage=${MAX_AGE}`);
  res.send(Buffer.from(await image.arrayBuffer()));
};

export default handler;
