const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseMatchesFromRawData, extractParticipants } = require('../execution/scrape_flashscore');
const feed = `SA÷1¬~AA÷AbCd1234¬AD÷${Math.floor(Date.now() / 1000)}¬AC÷3¬CX÷Roma¬AF÷PAOK¬AG÷2¬AH÷0¬OA÷roma.png¬OB÷paok.png¬`;

test('result feed preserves both original team badges', () => {
  const [match] = parseMatchesFromRawData(feed);
  assert.equal(match.homeLogo, 'https://static.flashscore.com/res/image/data/roma.png');
  assert.equal(match.awayLogo, 'https://static.flashscore.com/res/image/data/paok.png');
});
test('penalty imports use the tied score before the shootout', () => {
  const [match] = parseMatchesFromRawData(feed.replace('AC÷3', 'AC÷11') + 'AT÷1¬AU÷1¬RPA÷5¬RPB÷4¬');
  assert.deepEqual([match.homeScore, match.awayScore, match.penaltiesScore1, match.penaltiesScore2], ['1', '1', 5, 4]);
});
test('participants normalize relative badge paths', () => {
  const html = '<script>"participantsData":' + JSON.stringify({ home: [{ name: 'Roma', image_path: 'roma.png' }], away: [{ name: 'PAOK', image_path: 'paok.png' }] }) + '</script>';
  assert.equal(extractParticipants(html).home.logo, 'https://static.flashscore.com/res/image/data/roma.png');
});
for (const [iso, expected] of [
  ['2026-11-02T17:30:00Z', '02.11.2026 18:30'],
  ['2026-07-01T17:30:00Z', '01.07.2026 19:30'],
]) {
  test(`dates use Italian time independently of the hosting timezone: ${iso}`, () => {
    const timestamp = Math.floor(Date.parse(iso) / 1000);
    const raw = feed.replace(/AD÷\d+/, `AD÷${timestamp}`);
    assert.equal(parseMatchesFromRawData(raw)[0].date, expected);
  });
}
