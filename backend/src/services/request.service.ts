import Request from '../models/request.model';
import Item from '../models/item.model';
import { Op } from 'sequelize';

export class RequestService {
    static async create(userId: number, itemId: number, quantity: number, reason: string, dueDate?: Date) {
        const item = await Item.findByPk(itemId);
        if (!item || item.stock < quantity) throw new Error('Item unavailable or insufficient stock');
        const request = await Request.create({ userId, itemId, itemNo: item.itemNo, quantity, reason, dueDate });
        await Item.update({ stock: item.stock - quantity }, { where: { id: itemId } });
        
        return request;
    }
    static async getAll(userId: number, role: string, sortBy?: string) {
        const where = role === 'user' ? { userId } : {};
        const order = sortBy === 'date' ? [['dueDate', 'ASC']] : [['status', 'ASC']];
        
        return Request.findAll({ where, order, include: [Item, User] });
    }
    static async update(id: number, status: string) {
        return Request.update({ status }, { where: { id }, returning: true });
    }
    static async cancel(id: number) {
        return Request.destroy({ where: { id } });
    }
}