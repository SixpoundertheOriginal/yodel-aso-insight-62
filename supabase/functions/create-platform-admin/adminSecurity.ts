
/**
 * Generates a cryptographically secure password meeting enterprise complexity requirements.
 * Ensures the inclusion of uppercase, lowercase, digits, and special characters.
 *
 * @param {number} length - The desired length of the password. Must be at least 12.
 * @returns {string} A secure, randomly generated password.
 */
export function generateSecurePassword(length: number = 16): string {
  if (length < 12) {
    throw new Error('Password length must be at least 12 characters for security compliance.');
  }

  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = upper + lower + digits + special;

  let password = '';
  // Ensure at least one of each character type
  password += upper[crypto.getRandomValues(new Uint8Array(1))[0] % upper.length];
  password += lower[crypto.getRandomValues(new Uint8Array(1))[0] % lower.length];
  password += digits[crypto.getRandomValues(new Uint8Array(1))[0] % digits.length];
  password += special[crypto.getRandomValues(new Uint8Array(1))[0] % special.length];

  // Fill the rest of the password length with random characters from the full set
  const remainingLength = length - password.length;
  if (remainingLength > 0) {
    const randomBytes = new Uint8Array(remainingLength);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < remainingLength; i++) {
      password += all[randomBytes[i] % all.length];
    }
  }

  // Shuffle the password array to ensure character positions are random
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j_array = new Uint32Array(1);
    crypto.getRandomValues(j_array);
    const j = j_array[0] % (i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}
