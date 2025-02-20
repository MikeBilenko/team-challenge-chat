import { mapper } from "./CassandraClient";

const onlineStatusMapper = mapper.forModel('OnlineStatus');

export class OnlineStatusModel {
  static async getOnlineStatus(userID: string): Promise<boolean> {
    const result = await onlineStatusMapper.find({ user_id: userID });
    if (result.first()) {
      return true;
    }
    return false;
  }

  static async setOnlineStatus(userID: string, status: boolean): Promise<void> {
    if (status) {
      onlineStatusMapper.insert({ user_id: userID });
    } else {
      onlineStatusMapper.remove({ user_id: userID });
    }
  }
}