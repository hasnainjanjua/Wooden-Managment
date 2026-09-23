import { dbService } from '../sqlite';
import { User, AuthUser, UserRole } from '../../types';

export const userRepo = {
  initTable(): void {
    dbService.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT CHECK(role IN ('ADMIN', 'CASHIER', 'MANAGER')) DEFAULT 'CASHIER',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const existing = dbService.queryOne('SELECT COUNT(*) as cnt FROM users');
    if ((existing?.cnt || 0) === 0) {
      dbService.run(
        `INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)`,
        ['admin', 'admin', 'Muhammad Ahmad (Admin 1 / مالک)', 'ADMIN']
      );
      dbService.run(
        `INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)`,
        ['admin2', 'admin123', 'Partner (Admin 2 / پارٹنر)', 'ADMIN']
      );
    }
    try {
      dbService.run("DELETE FROM users WHERE username = 'cashier'");
    } catch (_) {}
  },

  getAll(): AuthUser[] {
    this.initTable();
    return dbService.query<AuthUser>(
      'SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY id ASC'
    );
  },

  getById(id: number): AuthUser | null {
    this.initTable();
    return dbService.queryOne<AuthUser>(
      'SELECT id, username, full_name, role, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
  },

  verifyCredentials(username: string, passwordAttempt: string): AuthUser | null {
    this.initTable();
    const cleanUsername = username.trim().toLowerCase();
    const row = dbService.queryOne<User>(
      'SELECT id, username, password, full_name, role, is_active, created_at FROM users WHERE LOWER(username) = ? AND is_active = 1',
      [cleanUsername]
    );

    if (!row) return null;
    if (row.password !== passwordAttempt.trim()) return null;

    return {
      id: row.id,
      username: row.username,
      full_name: row.full_name,
      role: row.role,
      is_active: row.is_active,
      created_at: row.created_at,
    };
  },

  changePassword(userId: number, newPassword: string): boolean {
    this.initTable();
    const res = dbService.run('UPDATE users SET password = ? WHERE id = ?', [
      newPassword.trim(),
      userId,
    ]);
    return res.changes > 0;
  },

  createUser(username: string, password: string, fullName: string, role: UserRole): AuthUser {
    this.initTable();
    const cleanUsername = username.trim().toLowerCase();
    const res = dbService.run(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
      [cleanUsername, password.trim(), fullName.trim(), role]
    );

    return {
      id: res.lastInsertRowid,
      username: cleanUsername,
      full_name: fullName.trim(),
      role,
      is_active: 1,
      created_at: new Date().toISOString(),
    };
  },

  updateUser(userId: number, fullName: string, role: UserRole, isActive = 1): void {
    this.initTable();
    dbService.run(
      'UPDATE users SET full_name = ?, role = ?, is_active = ? WHERE id = ?',
      [fullName.trim(), role, isActive, userId]
    );
  },
};
