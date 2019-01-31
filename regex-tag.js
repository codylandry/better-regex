
const REGEX_TAG_DEFAULT_CONFIG = {
  flags: '',
  lineBreaks: true,
  commentDelimiter: '##'
}

/**
 * Pulls out inner regex as raw string
 * @param regex {RegExp}
 */
function getRegexString (regex) {
  const regexString = regex.toString()
  const innerString = regexString.substr(1, regexString.lastIndexOf('/') - 1)
  return innerString
}

/**
 * returns line string excluding comments
 * @param line {string}
 * @param delimiter {string}
 * @returns {string}
 */
function removeRegexLineComment (line, delimiter) {
  const commentDelimiterIndex = line.lastIndexOf(delimiter)
  const commentOrLineEnd = commentDelimiterIndex !== -1 ? commentDelimiterIndex : line.length
  return line.substr(0, commentOrLineEnd)
}

function collapseMultilineRegexString (multilineRegexString, delimiter) {
  return multilineRegexString
    .split('\n')
    .map(s => removeRegexLineComment(s, delimiter))
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .join('')
}

function isRegex (value) {
  return ( value.exec && value.test )
}

function getDynamicParts (parts) {
  return parts.map(part => isRegex(part) ? getRegexString(part) : part)
}

/**
 * Template Tag that allows:
 *    - composing regular expressions
 *    - breaking expressions across multiple lines
 *    - commenting expression parts
 *
 * Basic Usage:
 * > const dateRegex = regex`
 *     (?<year>[0-9]{4})     ## year
 *     -
 *     (?<month>[0-9]{2})    ## month
 *     -
 *     (?<day>[0-9]{2})      ## day
 *   `
 * > const { year, month, day } = dateRegex.exec('2019-01-12').groups
 *
 * Advanced Usage (composition and config):
 *
 * > const title = regex`(?<title>mr|mrs|dr|ms)`
 * > const suffix = regex`(?<suffix>jr|sr)`
 * > const fullNameRegex = regex({flags: 'i'})`
 *    ^
 *    ${title}?
 *    \.?
 *    [ ]?
 *    (?<firstName>[a-zA-Z]+)
 *    [ ]
 *    (?<lastName>[a-zA-Z]+)
 *    [ ]?
 *    ${suffix}?
 *    \.?
 *    $
 *  `
 * > const { title, firstName, lastName, suffix } = fullNameRegex.exec(`Mr. Cody Landry Sr`).groups
 *
 * @param staticPartsOrConfig_ {object|array<string>|string}
 * @param dynamicParts_ {...string|RegExp}
 * @returns {function(*=, ...[*]=): RegExp}
 */
export function regex (staticPartsOrConfig_, ...dynamicParts_) {
  let config = REGEX_TAG_DEFAULT_CONFIG

  if (typeof staticPartsOrConfig_ === 'object' && !staticPartsOrConfig_.hasOwnProperty('length')) {
    config = {...REGEX_TAG_DEFAULT_CONFIG, ...staticPartsOrConfig_}
    return configuredRegex
  } else {
    return configuredRegex(staticPartsOrConfig_, ...dynamicParts_)
  }

  function configuredRegex (staticPartsOrConfig, ...dynamicParts) {
    dynamicParts = getDynamicParts(dynamicParts)
    let raw = String.raw(staticPartsOrConfig, ...dynamicParts)

    if (config.lineBreaks) {
      raw = collapseMultilineRegexString(raw, config.commentDelimiter)
    }

    return new RegExp(raw, config.flags)
  }
}

export default regex
