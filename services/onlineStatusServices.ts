import { OnlineStatusModel } from "../models/OnlineStatus";

export async function getOnlineStatus(userID: string): Promise<boolean> {
  return OnlineStatusModel.getOnlineStatus(userID);
}

export async function setOnlineStatus(userID: string, status: boolean): Promise<void> {
  OnlineStatusModel.setOnlineStatus(userID, status);
}