const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/components/notification/notification-inbox/notification-inbox.component.html');
let lines = fs.readFileSync(file, 'utf8').split('\n');

lines[43] = `                    title="{{ lang === 'TH' ? 'ลบข้อความที่อ่านแล้ว' : 'Delete Read Notifications' }}">`;
lines[107] = `                                        'วันที่แผนงาน' }}</span>`;
lines[112] = `                                    <span class="meta-label">{{ lang === 'EN' ? 'Part No.' : 'Part No.' }}</span>`;
lines[117] = `                                    <span class="meta-label">{{ lang === 'EN' ? 'Division' : 'Division' }}</span>`;
lines[123] = `                                    <span class="meta-label">{{ lang === 'EN' ? 'Div > Fac' : 'Div > Fac'`;
lines[154] = `                                            'สรุปการเปลี่ยนแปลง' }}`;
lines[160] = `                                                        <th>{{ lang === 'EN' ? 'Field' : 'Field' }}</th>`;
lines[161] = `                                                        <th class="col-old">{{ lang === 'EN' ? 'Before' : 'Before'`;
lines[163] = `                                                        <th class="col-new">{{ lang === 'EN' ? 'After' : 'After'`;
lines[180] = `                                            'ไม่พบการเปลี่ยนแปลงในข้อมูล'`;
lines[192] = `                                            {{ lang === 'EN' ? 'Items' : 'Items' }}`;
lines[194] = `                                                'Items' }})`;

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Fixed HTML encoding.');
