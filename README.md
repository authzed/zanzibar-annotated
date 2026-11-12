# Zanzibar Annotated

[![Discord Server](https://img.shields.io/discord/844600078504951838?color=7289da&logo=discord 'Discord Server')](https://authzed.com/discord)
[![Twitter](https://img.shields.io/twitter/follow/authzed?color=%23179CF0&logo=twitter&style=flat-square&label=@authzed '@authzed on Twitter')](https://twitter.com/authzed)

Zanzibar Annotated is a hosted copy of the [paper presented at USENIX ATC 2019](https://www.usenix.org/conference/atc19/presentation/pang) describing the Zanzibar authorization system.
It includes annotations that provide commentary on notable portions of the paper.

Looking for further discussion of the paper? Join our [Discord].

Looking to contribute? See [CONTRIBUTING.md].

[discord]: https://authzed.com/discord
[contributing.md]: https://github.com/authzed/zanzibar-annotated/blob/main/CONTRIBUTING.md

## Getting Started

First, run the development server:

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the paper.

### Configuration

All configuration is through environment variables, documented in [`.env.example`](.env.example).
None are required for local development.

| Variable | Description |
| --- | --- |
| `PREVIEW_ENDPOINT` | Public base URL of the site, used in share preview image URLs. Defaults to `https://$VERCEL_URL` on Vercel, and otherwise to `http://localhost:$PORT`. Set it when self-hosting so previews use your public URL. |

## Overview

The paper is presented by a reader app developed using the [NextJS] framework, [Tailwind CSS] for styling, and [MDX] for markdown integration in React.
The markdown support also includes math typesetting using [Katex] and GitHub flavored features with [remark-gfm].

[nextjs]: https://nextjs.org/
[tailwind css]: https://tailwindcss.com/
[mdx]: https://mdxjs.com/
[katex]: https://katex.org/
[remark-gfm]: https://github.com/remarkjs/remark-gfm

## Features

### Paper Content and Layout

Paper content is written in Markdown using [GitHub flavored syntax] and [Katex].
The paper viewer app provides additional components that are used to provide layout instructions to emulate the actual published paper.
This is in order to preserve the ability to refer to specific column and page numbers of the paper.

[GitHub flavored syntax]: https://github.github.com/gfm/

### Shareable Highlights

A shareable URL is created when paper contents are selected and a visitor to that URL will be navigated directly to that portion of the paper.
This functionality is based on the [deeplinks.js] library.

[deeplinks.js]: https://github.com/WesleyAC/deeplinks

### Annotations

Annotations to paper content can be shown along side the related part of the paper.
Additionally, specific parts of the paper can be visibily highlighted and associated with an annotation.

The paper layout component expects an annotations context.
The [default annotation provider] implementation uses YAML files to store all annotations and provides hooks for components to get annotations and annotation related state.

A collection of annotations can be organized into sets.
Each set can be toggled on and off and can contain additional metadata to be displayed along side the paper.

[default annotation provider]: https://github.com/authzed/zanzibar-annotated/blob/main/components/annotation.tsx

#### YAML format

One YAML file per annotation set.

Annotation YAML file format:
```
id: <An identifier unique across annotation sets>
label: The short, human readable version of the id
title: The descriptive name for the set
subtitle: Additional description of the set
cta: Short Markdown string for a call to action or link to additional info.
description: Markdown string for additional information about the set.
highlightColor: A tailwind color class name used to color code the annotations and highlights for this set. See https://tailwindcss.com/docs/customizing-colors

(Annotations are organized into groups. Each group has an id such as "page-1-col-2" and each annotation has an id such as "across-applications".)
groups:
  page-1-col-2:
    across-applications:
      content: |
        Markdown string for the annotation.
      (Optionally, later additions to the annotation, which are shown after it, oldest first.)
      addenda:
        - date: '2026-11-12'
          author: 'Who wrote the addendum (optional)'
          content: |
            Markdown string for the addendum.
    ...
  page-2-col-1:
    ...
```

See the [content] directory for example.

[content]: https://github.com/authzed/zanzibar-annotated/tree/main/content

#### Adding annotations

Annotations, addenda and new annotation sets can be written on the page itself when developing locally:

1. Run `pnpm dev` and open `http://localhost:3000/?edit`.
   Edit mode stays on in that tab until you choose `Exit` on its badge.
2. To add an annotation, select the text to annotate, within a single column of the paper.
   Choose the annotation set, adjust the entry id, write the annotation and save it.
3. To add an addendum, choose `Add addendum` on an annotation beside the paper.
4. To add an annotation set, choose `New set` in the top bar.
   Only its label is needed; the rest can be filled in later in its YAML file.
   The page reloads once the set is created.

Saving writes to the annotation set's YAML file and, for a new annotation, wraps the selected text in a `<Highlight>` in `content/zanzibar.mdx`.
A new set is written to `content/annotations-<id>.yaml` and added to the list of sets in `content/annotation-sets.ts`, which is the one place a set has to be listed.
Its highlight color is one of those kept by the safelist in `tailwind.config.js`.
Review the result with `git diff` and commit it.

A selection is refused, and nothing is written, if it can't be placed safely: if the same text appears more than once in the column and the text around it doesn't tell which is meant, or if it crosses a paragraph break, includes math or a figure, or cuts through italic text, code, a link or an existing highlight.
Those highlights are still added by hand.

Edit mode and the endpoint it saves to only exist under `next dev`.
The endpoint is in a file with the extension `.dev.mts`, which is only a route under `next dev`, so it isn't part of a build, and it only answers requests made from the same machine.

#### Linking

An annotation set can be directly linked using a URL fragment in the format:

`#annotations/<annotation set id>`

An individual annotation can be directly linked using:

`#annotations/<annotation set id>/<annotation entry id>`

### Open Graph Support

Preview images for selections are generated with [`next/og`](https://nextjs.org/docs/app/api-reference/functions/image-response), and preview text is generated using [NextJS] server side rendering and [JSDOM].
This provides a rich preview of the paper content when a shareable link is posted to another site.

The server renders the paper in-process to resolve selections, so no configuration is needed in the dev environment.

_Note: The paper viewer app relies on a serverless function to generate the previews. Currently, [Vercel] is the only tested hosting service._

[JSDOM]: https://github.com/jsdom/jsdom
[Vercel]: https://vercel.com/

## Host Your Own Paper

Other papers can be hosted using this reader app by providing the paper contents in MDX and [deploying on Vercel].

[Contribute] and get in touch if you do!

[deploying on Vercel]: https://vercel.com/docs/concepts/get-started/deploy
[contribute]: https://github.com/authzed/zanzibar-annotated/blob/main/CONTRIBUTING.md
