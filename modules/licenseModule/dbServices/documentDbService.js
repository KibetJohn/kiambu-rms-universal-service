const knex = require("../../../lib/knex");

const updateDocuments = async (
  body,
  condition,
  transaction,
  select = ["*"],
  whereInCondition = false
) => {
  let query;
  if (transaction) {
    query = transaction("documents").update(body);
    if (condition) {
      query.where(condition);
    }
    if (whereInCondition && Array.isArray(whereInCondition)) {
      query.whereIn(whereInCondition[0], whereInCondition[1]);
    }
    return await query.returning(select);
  } else query = knex("documents").update(body);
  if (condition) {
    query.where(condition);
  }
  if (whereInCondition) {
    query.whereIn(whereInCondition);
  }
  return await query.returning(select);
};

const insertDocuments = async (transaction, query, params) => {
  const queryExecution = transaction
    ? transaction.raw(query, params)
    : knex.raw(query, params);

  return queryExecution.then((result) => result.rows);
};

const updateDocumentsForStaff = async (
  updateData,
  docIds,
  select = ["*"],
  transaction
) => {
  try {
    const updatePromises = updateData.map((app, index) => {
      const docId = docIds[index];

      if (docId) {
        const updateBody = {
          permit_id: app.id,
        };

        let query;
        if (transaction) {
          query = transaction("documents")
            .where({ id: docId })
            .update(updateBody)
            .returning(select);
        } else {
          query = knex("documents")
            .where({ id: docId })
            .update(updateBody)
            .returning(select);
        }
        return query;
      }
    });
    const updatedRecords = await Promise.all(updatePromises);

    return updatedRecords.flat();
  } catch (error) {
    console.error("Error updating staff permit details", error);
    throw error;
  }
};

module.exports = {
  updateDocuments,
  insertDocuments,
  updateDocumentsForStaff,
};
