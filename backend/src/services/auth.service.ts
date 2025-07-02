import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import * as dotenv from 'dotenv';

dotenv.config();

export class AuthService {
    static async login(username: string, password: string) {
    const user = await User.findOne({ where: { username } });
    if (!user) throw new Error('Invalid credentials');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Invalid credentials');
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    return { token, role: user.role, userId: user.id };
  }
}