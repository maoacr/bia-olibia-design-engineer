export function channelFor(row, allRows) {
  const index = allRows.indexOf(row);
  return index < Math.ceil(allRows.length / 2)
    ? 'Outbound'
    : index < allRows.length - 1
      ? 'Referidos'
      : 'Inbound';
}
export function filterRows(
  allRows,
  { query = '', stage = '', owner = '', channel = '', minimum = '' } = {},
) {
  return allRows.filter(
    row =>
      row[0].toLowerCase().includes(query.toLowerCase()) &&
      (!stage || row[1] === stage) &&
      (!owner || row[3] === owner) &&
      (!channel || channelFor(row, allRows) === channel) &&
      (!minimum || row[2] >= Number(minimum)),
  );
}
