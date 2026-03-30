import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'smart_attendance',
});

async function seed() {
  await dataSource.initialize();
  const qr = dataSource.createQueryRunner();

  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // ===== Branches (HDBank HCM locations) =====
  const branches = await qr.query(`
    INSERT INTO "branches" ("name", "address", "latitude", "longitude", "radius_m")
    VALUES
      ('HDBank Hội Sở', '25bis Nguyễn Thị Minh Khai, Q.1, TP.HCM', 10.7769, 106.7009, 50),
      ('HDBank Bến Thành', '123 Lê Lợi, Q.1, TP.HCM', 10.7725, 106.6980, 50),
      ('HDBank Tân Bình', '456 Cộng Hòa, Q. Tân Bình, TP.HCM', 10.8012, 106.6523, 50)
    ON CONFLICT DO NOTHING
    RETURNING "id", "name"
  `);

  if (branches.length === 0) {
    console.log('Branches already exist, skipping seed.');
    await dataSource.destroy();
    return;
  }

  const [hoiSo, benThanh, tanBinh] = branches;
  console.log(`Created ${branches.length} branches`);

  // ===== WiFi BSSIDs =====
  await qr.query(`
    INSERT INTO "branch_wifi" ("branch_id", "bssid", "description")
    VALUES
      ($1, 'AA:BB:CC:DD:EE:01', 'Tầng 1 - Lobby'),
      ($1, 'AA:BB:CC:DD:EE:02', 'Tầng 2 - Văn phòng'),
      ($2, 'AA:BB:CC:DD:EE:11', 'Tầng 1'),
      ($3, 'AA:BB:CC:DD:EE:21', 'Tầng 1')
    ON CONFLICT DO NOTHING
  `, [hoiSo.id, benThanh.id, tanBinh.id]);

  console.log('Created WiFi BSSIDs');

  // ===== Departments =====
  const departments = await qr.query(`
    INSERT INTO "departments" ("name", "branch_id")
    VALUES
      ('Ban Giám Đốc', $1),
      ('Phòng IT', $1),
      ('Phòng Nhân Sự', $1),
      ('Phòng Giao Dịch', $2),
      ('Phòng Giao Dịch', $3)
    RETURNING "id", "name", "branch_id"
  `, [hoiSo.id, benThanh.id, tanBinh.id]);

  console.log(`Created ${departments.length} departments`);

  const itDept = departments.find((d: { name: string }) => d.name === 'Phòng IT');
  const hrDept = departments.find((d: { name: string }) => d.name === 'Phòng Nhân Sự');
  const gdBenThanh = departments.find(
    (d: { name: string; branch_id: string }) => d.name === 'Phòng Giao Dịch' && d.branch_id === benThanh.id,
  );

  // ===== Users =====
  await qr.query(`
    INSERT INTO "users" ("email", "password_hash", "full_name", "role", "branch_id", "department_id")
    VALUES
      ('admin@hdbank.com.vn', $1, 'Admin HDBank', 'ADMIN', $2, NULL),
      ('manager@hdbank.com.vn', $1, 'Nguyễn Văn Manager', 'MANAGER', $2, $4),
      ('nhanvien01@hdbank.com.vn', $1, 'Trần Thị Nhân Viên', 'EMPLOYEE', $2, $5),
      ('nhanvien02@hdbank.com.vn', $1, 'Lê Văn Dev', 'EMPLOYEE', $2, $5),
      ('nhanvien03@hdbank.com.vn', $1, 'Phạm Thị HR', 'EMPLOYEE', $2, $6),
      ('giaodich01@hdbank.com.vn', $1, 'Võ Văn Giao Dịch', 'EMPLOYEE', $3, $7)
    ON CONFLICT DO NOTHING
  `, [passwordHash, hoiSo.id, benThanh.id, itDept.id, itDept.id, hrDept.id, gdBenThanh.id]);

  console.log('Created users (password: 123456)');
  console.log('');
  console.log('=== Seed complete! ===');
  console.log('Admin:    admin@hdbank.com.vn / 123456');
  console.log('Manager:  manager@hdbank.com.vn / 123456');
  console.log('Employee: nhanvien01@hdbank.com.vn / 123456');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
