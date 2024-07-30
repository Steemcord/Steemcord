interface MatchResult {
  matched: boolean,
  freeVars: Record<number, Array<string>>
}

export function tokenize(str: string): string[] {
  const ans = str.split(/(\*+)/g);
  if (ans[0] === '')
    ans.shift();
  if (ans[ans.length - 1] === '')
    ans.pop();
  return ans;
}

export function match(pattern: string, str: string): MatchResult {
  const patternTokens = tokenize(pattern);
  const freeVars = {};
  let varGroup;
  let strParts = str;
  let matchAnything = false;
  let completeMatch = patternTokens.every(function (token) {
    if (token.charAt(0) === '*') {
      matchAnything = true;
      varGroup = token.length;
      freeVars[varGroup] = freeVars[varGroup] || [];
    } else {
      const matches = strParts.split(token);
      if (matches.length > 1) {
        // The token was found in the string.
        const possibleFreeVar = matches.shift();
        if (matchAnything) {
          // Found a possible candidate for the *.
          freeVars[varGroup].push(possibleFreeVar);
        } else {
          if (possibleFreeVar !== '') {
            // But if we haven't seen a * for this freeVar,
            // the string doesnt match the pattern.
            return false;
          }
        }

        matchAnything = false;
        // We matched up part of the pattern to the string
        // prepare to look at the next part of the string.
        strParts = matches.join(token);
      } else {
        // The token wasn't found in the string. Pattern doesn't match.
        return false;
      }
    }
    return true;
  });

  if (matchAnything) {
    // If we still need to match a string part up to a star,
    // match the rest of the string.
    freeVars[varGroup].push(strParts);
  } else {
    if (strParts !== '') {
      // There is still some string part that didn't match up to the pattern.
      completeMatch = false;
    }
  }

  return {
    matched: completeMatch,
    freeVars: freeVars
  };
}

export function replaceAfter(str: string, idx: number, match: string, replace: string): string {
  return str.substring(0, idx) + str.substring(idx).replace(match, replace);
}

export function matchReplace(pattern: MatchResult | string, replacePattern: string, str: string): string {
  let matchData: MatchResult;
  if (typeof pattern === 'string')
    matchData = match(pattern, str);
  else
    matchData = pattern;

  if (!matchData.matched) {
    // If the pattern didn't match.
    return str;
  }

  // Plug in the freevars in place of the stars.
  const starGroups = replacePattern.match(/\*+/g) || [];
  let currentStarGroupIdx = 0;
  let freeVar;
  let freeVarGroup;
  for (const starGroup of starGroups) {
    freeVarGroup = matchData.freeVars[starGroup.length] || [];
    freeVar = freeVarGroup.shift();
    freeVar = freeVar === undefined ? starGroup : freeVar;
    replacePattern = replaceAfter(replacePattern, currentStarGroupIdx, starGroup, freeVar);
    currentStarGroupIdx = replacePattern.indexOf(freeVar) + freeVar.length;
  }

  return replacePattern;
}