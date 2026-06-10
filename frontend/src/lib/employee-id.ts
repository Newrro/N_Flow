import { getDb } from './db';

/**
 * Generate employee ID in format: NR<YY><ROLE><SEQ>
 * Port of generate_employee_id() from main.py lines 71-125
 *
 * @param roleType - 'EM' (Employee), 'IN' (Intern), 'DR' (Director), 'VL' (Volunteer)
 * @param dateOfJoining - Date string in 'YYYY-MM-DD' format
 * @returns Generated employee ID (e.g., NR26EM001)
 */
export async function generateEmployeeId(
  roleType: string,
  dateOfJoining?: string
): Promise<string> {
  // Get year from date of joining, or use current year as fallback
  let year: string;

  if (dateOfJoining && dateOfJoining.length >= 4) {
    // Extract last 2 digits of year from YYYY-MM-DD
    year = dateOfJoining.substring(2, 4);
  } else {
    year = new Date().getFullYear().toString().slice(-2);
  }

  const prefix = `NR${year}${roleType}`;

  // Get the next available ID number from database
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT emp_id FROM employees WHERE emp_id LIKE ? ORDER BY emp_id DESC LIMIT 1`,
    args: [`${prefix}%`],
  });

  let nextNum = 1;

  if (result.rows.length > 0) {
    const lastId = result.rows[0].emp_id as string;
    try {
      const lastNum = parseInt(lastId.slice(-3), 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    } catch {
      nextNum = 1;
    }
  }

  // Format with leading zeros (e.g., 001, 002, 010, 100)
  const employeeId = `${prefix}${nextNum.toString().padStart(3, '0')}`;
  return employeeId;
}
