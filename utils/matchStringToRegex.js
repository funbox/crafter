module.exports = function matchStringToRegex(str, re) {
  const matchData = re.exec(str);

  if (!matchData) {
    return matchData;
  }

  const locations = [];
  let lastLocation = matchData.index;
  for (let i = 0; i < matchData.length; i++) {
    if (matchData[i]) {
      lastLocation = str.indexOf(matchData[i], lastLocation);
      locations.push(lastLocation);
    } else {
      locations.push(undefined);
    }
  }

  return [matchData, locations];
};
