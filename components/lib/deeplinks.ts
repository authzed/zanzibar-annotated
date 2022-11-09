// Original From: https://github.com/WesleyAC/deeplinks/blob/main/src/versions/2.ts
// Original License Below:
// Copyright © 2021 Wesley Aptekar-Cassels
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { fromNumber, toNumber } from './base64';
import { cyrb53 } from './cyrb53';

// See docs/spec/v2.md for what this code implements.

// See https://dom.spec.whatwg.org/#interface-node
// The minifier isn't smart enough to know this, so do it ourselves and save
// the, uh 26 bytes...
const TEXT_NODE = 3;
// Same as above, see https://dom.spec.whatwg.org/#interface-nodefilter
const NODEFILTER_SHOW_TEXT = 0x04;

function hashNode(n: Text): string {
  return fromNumber(cyrb53(n.wholeText.trim()));
}

function countLeadingWhitespace(node: Text): number {
  return node.wholeText.length - node.wholeText.trimStart().length;
}

// Take a range, and return a new range containing the same text, but ensuring
// that the start and end are both non-whitespace-only text nodes.
function normalizeRange(doc: Document, range: Range) {
  // We start off by picking start and end nodes. If the start node is a text
  // node, we can just use it as is. If it's a element node, though, we need to
  // use the offset to figure out which child node is the one that's actually
  // selected.
  //
  // There's a additional hiccup that the offsets used by Range represent the
  // spaces in between child nodes, while the TreeWalker API operates on the
  // nodes directly. Because of this, we need to keep track of whether the
  // selected text starts/ends before or after the start/end node. The
  // startOffset/endOffset variables do double duty in this regard — if the
  // startNode/endNode is a text node, the startOffset/endOffset is a text
  // offset, but if the startNode/endNode is a element node, they represent
  // whether the selection starts/ends before the node (0) or after the node
  // (1).

  const makeNodeAndOffset = (
    initNode: Node,
    initOffset: number
  ): [Node, number] => {
    let node, offset;
    if (initNode.nodeType == TEXT_NODE || initNode.childNodes.length == 0) {
      node = initNode;
      offset = initOffset;
    } else {
      node =
        initNode.childNodes[
          Math.min(initOffset, initNode.childNodes.length - 1)
        ];
      if (node.nodeType == TEXT_NODE) {
        offset =
          initOffset == initNode.childNodes.length
            ? (node as Text).wholeText.length
            : 0;
      } else {
        offset = initOffset == initNode.childNodes.length ? 1 : 0;
      }
    }
    return [node, offset];
  };

  const [startNode, startOffset] = makeNodeAndOffset(
    range.startContainer,
    range.startOffset
  );
  const [endNode, endOffset] = makeNodeAndOffset(
    range.endContainer,
    range.endOffset
  );

  const newRange = doc.createRange();
  const treeWalker = doc.createTreeWalker(range.commonAncestorContainer);
  // stages:
  // 0 = Looking for startNode.
  // 1 = startNode found, but it wasn't a non-empty text node — looking for a
  //     non-empty text node.
  // 2 = Looking for endNode.
  let stage = 0;
  let node: Node | null = treeWalker.currentNode;
  let prevEndNode = endNode;
  while (node) {
    if (stage == 0 && node == startNode) {
      if (node.nodeType != TEXT_NODE && startOffset != 0) {
        node = treeWalker.nextNode();
        if (!node) {
          return null;
        }
      }
      stage = 1;
    }
    if (node.nodeType == TEXT_NODE && (node as Text).wholeText.trim() != '') {
      if (stage == 1) {
        newRange.setStart(node, node == startNode ? startOffset : 0);
        stage = 2;
      }
      if (stage == 2) {
        prevEndNode = newRange.endContainer;
        newRange.setEnd(node, (node as Text).wholeText.length);
      }
    }
    if (stage == 2 && node == endNode) {
      if (node.nodeType == TEXT_NODE && (node as Text).wholeText.trim() != '') {
        newRange.setEnd(node, endOffset);
        return newRange;
      }
      if (node == newRange.endContainer && endOffset == 0) {
        newRange.setEnd(prevEndNode, (prevEndNode as Text).wholeText.length);
      }
      return newRange;
    }
    node = treeWalker.nextNode();
  }

  return null;
}

export function selectionToFragment(
  doc: Document,
  selection: Selection
): string {
  type HashNodeOffset = [string, Text, string];
  type DupeData = [boolean[], number, number];
  const ranges: [HashNodeOffset, HashNodeOffset, DupeData][] = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = normalizeRange(doc, selection.getRangeAt(i));
    if (range && !range.collapsed) {
      const [startNode, endNode] = [range.startContainer, range.endContainer];
      if (startNode.nodeType == TEXT_NODE && endNode.nodeType == TEXT_NODE) {
        ranges.push([
          [
            hashNode(startNode as Text),
            startNode as Text,
            fromNumber(
              Math.max(
                range.startOffset - countLeadingWhitespace(startNode as Text),
                0
              )
            ),
          ],
          [
            hashNode(endNode as Text),
            endNode as Text,
            fromNumber(
              Math.max(
                Math.min(
                  range.endOffset - countLeadingWhitespace(endNode as Text),
                  (endNode as Text).wholeText.trim().length
                ),
                0
              )
            ),
          ],
          [[], 0, 0],
        ]);
      }
    }
  }

  if (ranges.length == 0) {
    return '';
  }

  const walk = doc.createTreeWalker(doc.body, NODEFILTER_SHOW_TEXT);
  let node;
  while ((node = walk.nextNode() as Text)) {
    // eslint-disable-line no-cond-assign
    const hash = hashNode(node);
    for (const [[startHash, startNode], [endHash, endNode], dupes] of ranges) {
      if (startNode == node) {
        dupes[1] = dupes[0].length;
      }
      if (endNode == node) {
        dupes[2] = dupes[0].length;
      }
      if (startHash == hash) {
        dupes[0].push(true);
      } else if (endHash == hash) {
        dupes[0].push(false);
      }
    }
  }

  const fragmentParts = ranges.map(
    ([
      [startHash, , startOffset],
      [endHash, , endOffset],
      [dupes, startDupeOffset, endDupeOffset],
    ]) => {
      let fragmentPart;
      if (startHash == endHash) {
        fragmentPart = `${startHash}:${startOffset}:${endOffset}`;
      } else {
        fragmentPart = `${startHash}:${startOffset}.${endHash}:${endOffset}`;
      }
      if (new Set(dupes).size != dupes.length) {
        const dupesString = dupes.map((x) => (x ? 's' : 'e')).join('');
        fragmentPart += `~${dupesString}~${fromNumber(
          startDupeOffset
        )}~${fromNumber(endDupeOffset)}`;
      }
      return fragmentPart;
    }
  );

  return `#2${fragmentParts.join()}`;
}

function getRangeFromFragmentPart(doc: Document, fragmentPart: string): Range {
  const [hashOffsetFragmentPart, dupeString, dupeStartOffset, dupeEndOffset] =
    fragmentPart.split('~');
  const split = hashOffsetFragmentPart.split('.').map((x) => x.split(':'));
  let startHash, startOffset, endHash, endOffset;
  if (split.length == 1) {
    [[startHash, startOffset, endOffset]] = split;
    endHash = startHash;
  } else {
    [[startHash, startOffset], [endHash, endOffset]] = split;
  }
  [startOffset, endOffset] = [startOffset, endOffset].map(toNumber);

  // the boolean represents whether it's a start node (true) or end node (false)
  const nodes: [Text, boolean][] = [];

  const walk = doc.createTreeWalker(doc.body, NODEFILTER_SHOW_TEXT, null);
  let node,
    numEndNodes = 0;
  while ((node = walk.nextNode() as Text)) {
    // eslint-disable-line no-cond-assign
    const hash = hashNode(node);
    if (hash == startHash) {
      nodes.push([node, true]);
    } else if (hash == endHash) {
      nodes.push([node, false]);
      numEndNodes++;
    }
  }

  let startNode, endNode;

  if (
    dupeString &&
    nodes.map((n) => (n[1] ? 's' : 'e')).join('') == dupeString
  ) {
    startNode = nodes[toNumber(dupeStartOffset)];
    endNode = nodes[toNumber(dupeEndOffset)];
  }

  if (!startNode || !endNode) {
    if (startHash == endHash) {
      startNode = nodes[0];
      endNode = startNode;
    } else {
      // If there's more than one end node, start with the start node.  This
      // ensures that in cases where both nodes are ambiguous, the first pair is
      // selected.
      const anchorNodeType = numEndNodes > 1;
      const anchorNodeIndex = nodes.findIndex((e) => e[1] == anchorNodeType);
      startNode = nodes[anchorNodeType ? anchorNodeIndex : anchorNodeIndex - 1];
      endNode = nodes[anchorNodeType ? anchorNodeIndex + 1 : anchorNodeIndex];
    }
  }

  const range = doc.createRange();
  if (startNode && endNode) {
    range.setStart(
      startNode[0],
      Math.min(
        startOffset + countLeadingWhitespace(startNode[0]),
        startNode[0].wholeText.length
      )
    );
    range.setEnd(
      endNode[0],
      Math.min(
        endOffset + countLeadingWhitespace(endNode[0]),
        endNode[0].wholeText.length
      )
    );
  }
  return range;
}

export function fragmentToRangeList(doc: Document, fragment: string): Range[] {
  return fragment
    .substring(1)
    .split(',')
    .map((part) => getRangeFromFragmentPart(doc, part));
}
