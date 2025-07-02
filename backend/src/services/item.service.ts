import Item from '../models/item.model';
import { Op } from "sequelize";

export class ItemService {
    static async search(query: string, reason?: string) {
        return Item.findAll ({
            where: {name: { [Op.like]: '%${query}%' }},
            limit: 10
        })
    }
}