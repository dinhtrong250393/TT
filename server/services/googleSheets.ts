import db from '../db';
import bcrypt from 'bcryptjs';

// In a real application, this would use the googleapis package to fetch data from a Google Sheet.
// For this prototype, we simulate the data that would be returned from the Google Sheets API.

const mockGoogleSheetsData = [
  { username: 'teacher1', password: 'password123', fullName: 'Nguyễn Văn Giáo Viên', role: 'teacher', class: '', status: 'active' },
  { username: 'student1', password: 'password123', fullName: 'Trần Thị Học Sinh', role: 'student', class: '12A1', status: 'active' },
  { username: 'student2', password: 'password123', fullName: 'Lê Văn Học Sinh', role: 'student', class: '12A1', status: 'active' }
];

export async function syncAccountsFromGoogleSheets() {
  console.log('Syncing accounts from Google Sheets...');
  
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const data = mockGoogleSheetsData;
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password, full_name, role, class, status)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        full_name = excluded.full_name,
        role = excluded.role,
        class = excluded.class,
        status = excluded.status
    `);

    const insertMany = db.transaction((users) => {
      for (const user of users) {
        // Only hash password if it's a new user or password changed (simplified here)
        // In a real app, you might not store passwords in plaintext in Google Sheets,
        // or you'd generate them and email them.
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        stmt.run(user.username, hashedPassword, user.fullName, user.role, user.class, user.status);
      }
    });

    insertMany(data);
    console.log('Successfully synced accounts from Google Sheets.');
    return { success: true, count: data.length };
  } catch (error) {
    console.error('Error syncing from Google Sheets:', error);
    return { success: false, error: 'Failed to sync' };
  }
}
