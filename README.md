# Zanzibar Annotated

[![Discord Server](https://img.shields.io/discord/844600078504951838?color=7289da&logo=discord "Discord Server")](https://authzed.com/discord)
[![Twitter](https://img.shields.io/twitter/follow/authzed?color=%23179CF0&logo=twitter&style=flat-square&label=@authzed "@authzed on Twitter")](https://twitter.com/authzed)

Zanzibar Annotated is a hosted copy of the [paper presented at USENIX ATC 2019](https://www.usenix.org/conference/atc19/presentation/pang) describing the Zanzibar authorization system. It includes annotations that provide commentary on notable portions of the paper.

Looking for further discussion of the paper? Join our [Discord].

Looking to contribute? See [CONTRIBUTING.md].

[Discord]: https://authzed.com/discord
[CONTRIBUTING.md]: https://github.com/authzed/zanzibar-annotated/blob/main/CONTRIBUTING.md

## Getting Started

First, run the development server:

```bash
yarn install
yarn run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the paper.

## Overview

This is a NextJS project that uses [Tailwind CSS] for styling and [MDX] for markdown integration in React. The markdown support also includes math typesetting using [Katex] and GitHub flavored features with [remark-gfm].

[Tailwind CSS]: https://tailwindcss.com/
[MDX]: https://mdxjs.com/
[Katex]: https://katex.org/
[remark-gfm]: https://github.com/remarkjs/remark-gfm

### Paper Layout

The paper content is stored as markdown but with markup that provides layout instructions to emulate the actual published paper. This is in order to preserve the ability to refer to specific column and page numbers of the paper.

### Annotations

The paper layout expects an annotations context. The [default annotation provider] implementation uses YAML files to store all annotations and provides hooks for components to get annotations and annotation related state.

A collection of annotations can be organized into sets. Each set can be toggled on and off and can contain additional metadata to be displayed along side the paper.

[default annotation provider]: https://github.com/authzed/zanzibar-annotated/blob/main/components/annotation.tsx

#### YAML format
