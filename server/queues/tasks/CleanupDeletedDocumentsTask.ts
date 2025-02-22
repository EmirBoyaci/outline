import { subDays } from "date-fns";
import { Op } from "sequelize";
import documentPermanentDeleter from "@server/commands/documentPermanentDeleter";
import Logger from "@server/logging/logger";
import { Document } from "@server/models";
import BaseTask, { TaskPriority } from "./BaseTask";

type Props = {
  limit: number;
};

export default class CleanupDeletedDocumentsTask extends BaseTask<Props> {
  public async perform({ limit }: Props) {
    Logger.info(
      "task",
      `Permanently destroying upto ${limit} documents older than 30 days…`
    );
    const documents = await Document.scope("withDrafts").findAll({
      attributes: ["id", "teamId", "text", "deletedAt"],
      where: {
        deletedAt: {
          [Op.lt]: subDays(new Date(), 30),
        },
      },
      paranoid: false,
      limit,
    });
    const countDeletedDocument = await documentPermanentDeleter(documents);
    Logger.info("task", `Destroyed ${countDeletedDocument} documents`);
  }

  public get options() {
    return {
      attempts: 1,
      priority: TaskPriority.Background,
    };
  }
}
