// COPPA age screen: accounts are for people 13 and older.
// Only the yes/no result is ever sent or stored — never the birthdate.
export const MIN_AGE = 13;

// birthDate is the 'YYYY-MM-DD' string from <input type="date">.
export function isOldEnough(birthDate, today = new Date()) {
  const [y, m, d] = birthDate.split('-').map(Number);
  if (!y || !m || !d) return false;
  let age = today.getFullYear() - y;
  // Birthday hasn't happened yet this year → one year younger.
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age >= MIN_AGE;
}
