import test from 'node:test';
import assert from 'node:assert/strict';
import { readingMinutes } from '../src/lib/publishing.mjs';
import media from '../src/plugins/rehype-media.mjs';
test('reading time counts prose, excludes media destinations and fenced code', () => {
  assert.equal(readingMinutes(''), 1);
  assert.equal(readingMinutes('word '.repeat(201)), 2);
  assert.equal(readingMinutes('![photo](https://example.com/photo.png)\n```js\n' + 'word '.repeat(800) + '\n```'), 1);
});
function embed(href) {
  const tree = { type: 'root', children: [{ type: 'element', tagName: 'p', children: [{ type: 'element', tagName: 'a', properties: { href }, children: [{ type: 'text', value: 'Test clip' }] }] }] };
  media()(tree);
  return tree.children[0];
}
test('uploaded videos become accessible native players without autoplay', () => {
  for (const url of ['/videos/demo.mp4', 'https://example.com/demo.webm']) {
    const figure = embed(url);
    assert.equal(figure.tagName, 'figure');
    const video = figure.children[0];
    assert.equal(video.tagName, 'video');
    assert.equal(video.properties.controls, true);
    assert.equal(video.properties.playsInline, true);
    assert.equal(video.properties.autoplay, undefined);
  }
});
test('unsafe URLs do not become media embeds', () => {
  for (const url of ['javascript:demo.mp4', '//example.com/demo.mp4', 'data:video/mp4,abc', 'http://example.com/demo.mp4']) assert.equal(embed(url).tagName, 'p');
});
