const errors = require("../../../lib/errors");
const promisify = require("../../../lib/async");
const knex = require("../../../lib/knex");
const logger = require("../../../lib/logger");
const appConstants = require("../../../constant/appConstants");
const {
  submitApplication,
  assignSubCountyToNewApplication,
  getPaymentIntent,
} = require("../../../lib/api");
const {
  toSentenceCase,
  convertKeysToSnakeCase,
  convertKeysToCamelCase
} = require("../../../lib/helper");

const { _ } = require("lodash");
const {
  updateDocuments,
  insertDocuments,
} = require("../dbServices/documentDbService");
const { getFromRedis } = require("../../../lib/redis");
const { redisKeys } = require("../../../constant/redisKeys");
const { findOneServiceData, findExistingCategory, findExistingSubCategory } = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");
const { insertLandParcel, fetchLandParcels, getZoneDataBySubCounty } = require("../dbServices/landRegistryDbService");
const { licensePermitService, fetchLicensePermitDetails } = require("../dbServices/permitDbService");
const ApiError = require("../../../lib/ApiError");

const landParcelApplicationService = async (req) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    req.body = convertKeysToSnakeCase(req.body);
    const { body, headers } = req;

    const {
      service_id,
      county_id,
      is_admin = false,
      personal_details,
      land_details,
      documents,
      user_id,
    } = body;

    const {
      first_name,
      last_name,
      other_name,
      identification_number,
      kra_pin,
      mobile_number,
      email,
    } = personal_details;

    const {
      land_size,
      land_no,
      sub_county_id,
      ward_id,
      longitude,
      latitude,
      village,
      land_use_id,
      year,
    } = land_details;

    const { uploaded_documents } = documents;

    const actingUserId = is_admin ? user_id : req.user?.id;
    if (is_admin && !user_id) {
      throw errors.INVALID_INPUT("user_id is required when submitting as admin.");
    }

    const [serviceData] = await findOneServiceData({ id: service_id });
    if (!serviceData) throw errors.NOT_FOUND("Invalid service.");

    const existingApplication = await knex("land_parcels")
    .where({ land_no, county_id })
    .whereIn("application_status", [
      appConstants.APPLICATION_STATUS.SUBMITTED,
      appConstants.APPLICATION_STATUS.IN_PROCESS,
      appConstants.APPLICATION_STATUS.APPROVED,
      appConstants.APPLICATION_STATUS.QUERY_RAISED,
    ])
    .first();

    if (existingApplication) {
      throw errors.ALREADY_EXISTS(
        `A land parcel application for land number ${land_no} already exists and is currently in process.`
      );
    }

    const docQuery = `INSERT INTO documents (documents, user_id) VALUES (?::jsonb, ?) RETURNING id`;
    const documentParams = [JSON.stringify(uploaded_documents), actingUserId];
    const [uploadedDoc] = await insertDocuments(transaction, docQuery, documentParams);

    let subCounty = _.get(await getFromRedis(redisKeys.subCounties), sub_county_id, "");
    subCounty = toSentenceCase(_.get(subCounty, "name", ""));

    const zoneData = await getZoneDataBySubCounty(sub_county_id);
    if (!zoneData) throw errors.NOT_FOUND("No zone data found for the selected subcounty.");

    const { land_zone_id } = zoneData;

    const parcelPayload = {
      county_id,
      service_id,
      created_by: req.user?.id,
      user_id: actingUserId,
      first_name,
      last_name,
      other_name,
      identification_number,
      kra_pin,
      mobile_number,
      email,
      land_size,
      land_no,
      land_status: appConstants.LAND_STATUS.PENDING,
      sub_county_id,
      ward_id,
      longitude,
      latitude,
      village,
      land_use_id,
      year,
      land_zone_id,
      uploaded_documents_id: uploadedDoc.id,
      application_status: appConstants.APPLICATION_STATUS.SUBMITTED,
      payment_status: appConstants.PAYMENT_STATUS.PAID,
      sub_type: appConstants.LAND_SUB_TYPE.NEW_LAND,
    };

    const [insertedParcel] = await insertLandParcel(parcelPayload, transaction);

    const applicationBody = {
      user_id: actingUserId,
      county_id,
      documents: uploaded_documents,
      type: serviceData.name,
      sub_type: appConstants.LAND_SUB_TYPE.NEW_LAND,
      application: JSON.stringify({
        service_id,
        service_name: serviceData.name,
        first_name,
        last_name,
        other_name,
        identification_number,
        kra_pin,
        mobile_number,
        email,
        land_size,
        land_no,
        longitude,
        latitude,
        village,
        land_use_id,
        sub_county_id,
        sub_county: subCounty,
        ward_id,
        year,
        land_zone_id,
      }),
      is_admin,
    };

    const application = await submitApplication(applicationBody, headers);

    await transaction("land_parcels")
      .update({ application_id: application?.data?.applicationId })
      .where({ id: insertedParcel });

    await transaction.commit();

    const [updatedParcel] = await knex("land_parcels")
      .select("application_id", "payment_status", "sub_county_id")
      .where({ id: insertedParcel });

    await assignSubCountyToNewApplication(
      {
        application_id: updatedParcel.application_id,
        sub_county_id: updatedParcel.sub_county_id,
        payment_status: updatedParcel.payment_status,
      },
      headers
    );

    return {
      parcelId: insertedParcel,
      applicationId: application?.data?.applicationId,
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error in landParcelApplicationService: ${error?.message}`, { error });
    throw error;
  }
};

const landParcelSearchService = async (req) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);
    req.query = convertKeysToSnakeCase(req.query);

    const { county_id, service_id } = req.body;
    const { search } = req.query;

    const parcels = await fetchLandParcels({ county_id, search, service_id });

    if (!parcels.length)
    throw new ApiError("No land parcels found.", 404, "NOT_FOUND");

    return parcels;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error(`Error in landParcelSearchService: ${error?.message}`, { error });
    }
    throw error;
  }
};

const landParcelListService = async (req) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);
    req.query = convertKeysToSnakeCase(req.query);

    const { county_id, service_id } = req.body;
    let { limit, page } = req.query;
    const user_id = req.user?.id;

    limit = parseInt(limit, 10);
    page = parseInt(page, 10);

    return await fetchLandParcels({ county_id, user_id, service_id, limit, page });
  } catch (error) {
    logger.error(`Error in landParcelListService: ${error?.message}`, { error });
    throw error;
  }
};

const landSubdivisionApplicationService = async (req) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    req.body = convertKeysToSnakeCase(req.body);
    const { body, headers } = req;

    const {
      service_id,
      county_id,
      personal_details,
      parent_parcel,
      proposed_plots,
      gis_location,
      documents,
      is_admin = false,
      user_id,
    } = body;

    const {
      first_name,
      last_name,
      other_name,
      identification_number,
      kra_pin,
      mobile_number,
      email,
    } = personal_details;

    const { parent_lr_number, parent_size, parcel_id } = parent_parcel;
    const { latitude, longitude, location } = gis_location;
    const { uploaded_documents } = documents;

    const actingUserId = is_admin ? user_id : req.user?.id;
    if (is_admin && !user_id) {
      throw errors.INVALID_INPUT("user_id is required when submitting as admin.");
    }

    const [serviceData] = await findOneServiceData({ id: service_id });
    if (!serviceData) throw errors.NOT_FOUND("Invalid service.");

    const [checkCategory] = await findExistingCategory({
      county_id,
      name: appConstants.LAND_CATEGORY.LAND_MANAGEMENT.toLowerCase(),
    });
    if (!checkCategory)
      throw errors.NOT_FOUND("Land management category not found.");

    const [checkSubCategory] = await findExistingSubCategory({
      category_id: checkCategory.id,
      name: appConstants.LAND_SUB_TYPE.LAND_SUBDIVISION.toLowerCase(),
    });
    if (!checkSubCategory)
      throw errors.NOT_FOUND("Land subdivision sub-category not found.");

    const licenseMasterDataDetails = await fetchLicensePermitDetails({
      category_id: checkCategory.id,
      sub_category_id: checkSubCategory.id,
      service_id,
      is_active: true,
    });
    if (!licenseMasterDataDetails)
      throw errors.NOT_FOUND("License master data not found.");

    const existingParcel = await knex("land_parcels")
      .where({ id: parcel_id, county_id })
      .first();

    if (!existingParcel)
      throw errors.NOT_FOUND("Parent land parcel not found.");

    if (existingParcel.land_status !== appConstants.LAND_STATUS.ACTIVE)
      throw errors.INVALID_INPUT(
        "Parent land parcel is not active and cannot be subdivided."
      );

    const existingSubdivision = await knex("license_permits")
      .where({
        land_parcel_id: parcel_id,
        sub_type: appConstants.LAND_SUB_TYPE.LAND_SUBDIVISION,
      })
      .whereIn("application_status", [
        appConstants.APPLICATION_STATUS.SUBMITTED,
        appConstants.APPLICATION_STATUS.IN_PROCESS,
        appConstants.APPLICATION_STATUS.QUERY_RAISED,
      ])
      .first();

    if (existingSubdivision)
      throw errors.ALREADY_EXISTS(
        "A subdivision application for this parcel is already in progress."
      );

    const docQuery = `INSERT INTO documents (documents, user_id) VALUES (?::jsonb, ?) RETURNING id`;
    const documentParams = [JSON.stringify(uploaded_documents), actingUserId];
    const [uploadedDoc] = await insertDocuments(transaction, docQuery, documentParams);

    let subCounty = _.get(await getFromRedis(redisKeys.subCounties), existingParcel.sub_county_id, "");
    subCounty = toSentenceCase(_.get(subCounty, "name", ""));

    const permitPayload = {
      user_id: actingUserId,
      county_id,
      service_id,
      created_by: req.user?.id,
      email,
      phone_number: mobile_number,
      id_number: identification_number,
      sub_county_id: existingParcel.sub_county_id,
      ward_id: existingParcel.ward_id,
      uploaded_documents_id: uploadedDoc.id,
      application_status: appConstants.APPLICATION_STATUS.SUBMITTED,
      payment_status: licenseMasterDataDetails?.applicationFee
        ? appConstants.PAYMENT_STATUS.NOT_PAID
        : appConstants.PAYMENT_STATUS.PAID,
      permit_status: appConstants.PERMIT_STATUS.PENDING,
      permit_master_id: licenseMasterDataDetails?.id,
      amount: licenseMasterDataDetails?.applicationFee
        ? licenseMasterDataDetails?.amount
        : 0,
      sub_type: appConstants.LAND_SUB_TYPE.LAND_SUBDIVISION,
      land_parcel_id: parcel_id,
      license_data: JSON.stringify({
        first_name,
        last_name,
        other_name,
        identification_number,
        kra_pin,
        mobile_number,
        email,
        parent_lr_number,
        parent_size,
        proposed_plots,
        latitude,
        longitude,
        location,
      }),
    };

    const [insertedPermit] = await licensePermitService(permitPayload, transaction);

    let paymentDetails;
    if (licenseMasterDataDetails?.applicationFee) {
      paymentDetails = await getPaymentIntent(
        {
          user_id: actingUserId,
          entity_id: insertedPermit,
          email,
          payment_type: appConstants.AUDIT_CONSTANTS.UNIVERSAL,
          created_by: req.user?.id,
          county_id,
          amount: licenseMasterDataDetails?.amount.toString(),
          phone_number: mobile_number,
          sub_service_type: serviceData.name,
        },
        req.query,
        headers
      );

      if (!paymentDetails?.paymentIntent?.id)
        throw errors.NOT_FOUND("Payment Failed.");
    }

    const applicationBody = {
      user_id: actingUserId,
      county_id,
      documents: uploaded_documents,
      type: serviceData.name,
      sub_type: appConstants.LAND_SUB_TYPE.LAND_SUBDIVISION,
      application: JSON.stringify({
        service_id,
        service_name: serviceData.name,
        category: checkCategory?.name,
        sub_category: checkSubCategory?.name,
        first_name,
        last_name,
        other_name,
        identification_number,
        kra_pin,
        mobile_number,
        email,
        parent_lr_number,
        parent_size,
        parcel_id,
        proposed_plots,
        latitude,
        longitude,
        location,
        sub_county_id: existingParcel.sub_county_id,
        sub_county: subCounty,
        ward_id: existingParcel.ward_id,
      }),
      is_admin,
    };

    const application = await submitApplication(applicationBody, headers);

    await transaction("license_permits")
      .update({
        application_id: application?.data?.applicationId,
        payment_id: paymentDetails?.paymentIntent?.id || null,
      })
      .where({ id: insertedPermit });

    await updateDocuments(
      { permit_id: insertedPermit },
      { id: uploadedDoc.id },
      transaction,
      ["id"]
    );

    const [updatedPermit] = await transaction("license_permits")
      .select("application_id", "payment_status", "sub_county_id")
      .where({ id: insertedPermit });

    await transaction.commit();

    await assignSubCountyToNewApplication(
      {
        application_id: updatedPermit.application_id,
        sub_county_id: updatedPermit.sub_county_id,
        payment_status: updatedPermit.payment_status,
      },
      headers
    );

    return {
      permitId: insertedPermit,
      applicationId: application?.data?.applicationId,
      paymentIntent: convertKeysToCamelCase(paymentDetails?.paymentIntent),
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error in landSubdivisionApplicationService: ${error?.message}`, { error });
    throw error;
  }
};

const landUseChangeApplicationService = async (req) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    req.body = convertKeysToSnakeCase(req.body);
    const { body, headers } = req;

    const {
      service_id,
      county_id,
      personal_details,
      land_details,
      documents,
      is_admin = false,
      user_id,
    } = body;

    const {
      first_name,
      last_name,
      other_name,
      identification_number,
      kra_pin,
      mobile_number,
      email,
    } = personal_details;

    const {
      land_no,
      longitude,
      latitude,
      sub_county_id,
      ward_id,
      current_use_id,
      new_use_id,
    } = land_details;

    const { uploaded_documents } = documents;

    const actingUserId = is_admin ? user_id : req.user?.id;
    if (is_admin && !user_id) {
      throw errors.INVALID_INPUT("user_id is required when submitting as admin.");
    }

    const [serviceData] = await findOneServiceData({ id: service_id });
    if (!serviceData) throw errors.NOT_FOUND("Invalid service.");

    const [checkCategory] = await findExistingCategory({
      county_id,
      name: appConstants.LAND_CATEGORY.LAND_MANAGEMENT.toLowerCase(),
    });
    if (!checkCategory)
      throw errors.NOT_FOUND("Land management category not found.");

    const [checkSubCategory] = await findExistingSubCategory({
      category_id: checkCategory.id,
      name: appConstants.LAND_SUB_TYPE.LAND_USE_CHANGE.toLowerCase(),
    });
    if (!checkSubCategory)
      throw errors.NOT_FOUND("Land use change sub-category not found.");

    const licenseMasterDataDetails = await fetchLicensePermitDetails({
      category_id: checkCategory.id,
      sub_category_id: checkSubCategory.id,
      service_id,
      is_active: true,
    });
    if (!licenseMasterDataDetails)
      throw errors.NOT_FOUND("License master data not found.");

    const existingParcel = await knex("land_parcels")
      .where({ land_no, county_id })
      .first();

    if (!existingParcel)
      throw errors.NOT_FOUND("Land parcel not found.");

    if (existingParcel.land_status !== appConstants.LAND_STATUS.ACTIVE)
      throw errors.INVALID_INPUT(
        "Land parcel is not active and cannot have its use changed."
      );

    const existingChangeOfUse = await knex("license_permits")
      .where({
        land_parcel_id: existingParcel.id,
        sub_type: appConstants.LAND_SUB_TYPE.LAND_USE_CHANGE,
      })
      .whereIn("application_status", [
        appConstants.APPLICATION_STATUS.SUBMITTED,
        appConstants.APPLICATION_STATUS.IN_PROCESS,
        appConstants.APPLICATION_STATUS.QUERY_RAISED,
      ])
      .first();

    if (existingChangeOfUse)
      throw errors.ALREADY_EXISTS(
        "A change of use application for this parcel is already in progress."
      );

    const docQuery = `INSERT INTO documents (documents, user_id) VALUES (?::jsonb, ?) RETURNING id`;
    const documentParams = [JSON.stringify(uploaded_documents), req.user?.id];
    const [uploadedDoc] = await insertDocuments(transaction, docQuery, documentParams);

    let subCounty = _.get(await getFromRedis(redisKeys.subCounties), sub_county_id, "");
    subCounty = toSentenceCase(_.get(subCounty, "name", ""));

    const permitPayload = {
      user_id: actingUserId,
      county_id,
      service_id,
      created_by: req.user?.id,
      email,
      phone_number: mobile_number,
      id_number: identification_number,
      sub_county_id,
      ward_id,
      uploaded_documents_id: uploadedDoc.id,
      application_status: appConstants.APPLICATION_STATUS.SUBMITTED,
      payment_status: licenseMasterDataDetails?.applicationFee
        ? appConstants.PAYMENT_STATUS.NOT_PAID
        : appConstants.PAYMENT_STATUS.PAID,
      permit_status: appConstants.PERMIT_STATUS.PENDING,
      permit_master_id: licenseMasterDataDetails?.id,
      amount: licenseMasterDataDetails?.applicationFee
        ? licenseMasterDataDetails?.amount
        : 0,
      sub_type: appConstants.LAND_SUB_TYPE.LAND_USE_CHANGE,
      land_parcel_id: existingParcel.id,
      license_data: JSON.stringify({
        first_name,
        last_name,
        other_name,
        identification_number,
        kra_pin,
        mobile_number,
        email,
        land_no,
        longitude,
        latitude,
        current_use_id,
        new_use_id,
      }),
    };

    const [insertedPermit] = await licensePermitService(permitPayload, transaction);

    let paymentDetails;
    if (licenseMasterDataDetails?.applicationFee) {
      paymentDetails = await getPaymentIntent(
        {
          user_id: actingUserId,
          entity_id: insertedPermit,
          email,
          payment_type: appConstants.AUDIT_CONSTANTS.UNIVERSAL,
          created_by: req.user?.id,
          county_id,
          amount: licenseMasterDataDetails?.amount.toString(),
          phone_number: mobile_number,
          sub_service_type: serviceData.name,
        },
        req.query,
        headers
      );

      if (!paymentDetails?.paymentIntent?.id)
        throw errors.NOT_FOUND("Payment Failed.");
    }

    const applicationBody = {
      user_id: actingUserId,
      county_id,
      documents: uploaded_documents,
      type: serviceData.name,
      sub_type: appConstants.LAND_SUB_TYPE.LAND_USE_CHANGE,
      application: JSON.stringify({
        service_id,
        service_name: serviceData.name,
        category: checkCategory?.name,
        sub_category: checkSubCategory?.name,
        first_name,
        last_name,
        other_name,
        identification_number,
        kra_pin,
        mobile_number,
        email,
        land_no,
        longitude,
        latitude,
        current_use_id,
        new_use_id,
        sub_county_id,
        sub_county: subCounty,
        ward_id,
      }),
      is_admin,
    };

    const application = await submitApplication(applicationBody, headers);

    await transaction("license_permits")
      .update({
        application_id: application?.data?.applicationId,
        payment_id: paymentDetails?.paymentIntent?.id || null,
      })
      .where({ id: insertedPermit });

    await updateDocuments(
      { permit_id: insertedPermit },
      { id: uploadedDoc.id },
      transaction,
      ["id"]
    );

    const [updatedPermit] = await transaction("license_permits")
      .select("application_id", "payment_status", "sub_county_id")
      .where({ id: insertedPermit });

    await transaction.commit();

    await assignSubCountyToNewApplication(
      {
        application_id: updatedPermit.application_id,
        sub_county_id: updatedPermit.sub_county_id,
        payment_status: updatedPermit.payment_status,
      },
      headers
    );

    return {
      permitId: insertedPermit,
      applicationId: application?.data?.applicationId,
      paymentIntent: convertKeysToCamelCase(paymentDetails?.paymentIntent),
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error in landUseChangeApplicationService: ${error?.message}`, { error });
    throw error;
  }
};

const allLandParcelsService = async (req) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);
    req.query = convertKeysToSnakeCase(req.query);

    const { county_id, service_id, user_id } = req.body;
    let { limit, page } = req.query;

    limit = parseInt(limit, 10);
    page = parseInt(page, 10);

    return await fetchLandParcels({ county_id, service_id, user_id, limit, page });
  } catch (error) {
    logger.error(`Error in allLandParcelsService: ${error?.message}`, { error });
    throw error;
  }
};

const landParcelCountService = async (req) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);
    const { county_id, service_id } = req.body;

    const { count } = await knex("land_parcels as lps")
      .where({ "lps.county_id": county_id })
      .modify((qb) => {
        if (service_id) qb.where("lps.service_id", service_id);
      })
      .count("lps.id as count")
      .first();

    return { total: parseInt(count, 10) };
  } catch (error) {
    logger.error(`Error in landParcelCountService: ${error?.message}`, { error });
    throw error;
  }
};

const getParcelDataService = async (req) => {
  const { lrno } = req.params;

  const parcel = await knex("land_parcels as lps")
    .where({ "lps.land_no": lrno })
    .select(
      "lps.land_size",
      "lps.land_use_id",
      "lps.year",
      "lps.sub_county_id",
      "lps.land_zone_id",
      "lrpd.id as pricing_id",
      "lz.name as zone_name",
      "lz.code as zone_code",
      "lut.name as land_use_name",
      "szd.usv_value_id as rate_unit_id",
      "szd.parcel_value",
      "ru.name as rate_unit",
      "lrpd.rate",
      "lrpd.path_id",
      "pc.name as path_name",
      "pc.code as path_code",
    )
    .leftJoin("land_zones as lz", "lz.id", "lps.land_zone_id")
    .leftJoin("land_use_types as lut", "lut.id", "lps.land_use_id")
    .joinRaw(`LEFT JOIN subcounty_zone_data as szd ON szd.land_zone_id = lps.land_zone_id AND szd.zone_data->'sub_counties' @> to_jsonb(ARRAY[lps.sub_county_id::text])`)
    .leftJoin("rate_units as ru", "ru.id", "szd.usv_value_id")
    .leftJoin("land_rate_pricing_data as lrpd", function () {
      this.on("lrpd.zone_id", "lps.land_zone_id")
        .andOn("lrpd.land_use_id", "lps.land_use_id")
        .andOnVal("lrpd.year", knex.raw("lps.year::integer"));
    })
    .leftJoin("path_codes as pc", "pc.id", "lrpd.path_id")
    .first();

  if (!parcel) return null;

  const data = convertKeysToCamelCase(parcel);

  const subCounties = await getFromRedis(redisKeys.subCounties);
  if (subCounties) {
    const subCounty = subCounties[data.subCountyId];
    data.subCounty = subCounty ? toSentenceCase(subCounty.name) : null;
  }
  if (!data.pathCode) {
    throw errors.NOT_FOUND(`No pricing data found for year ${data.year}`);
  }

  return data;
};


module.exports = {
  landParcelApplicationService,
  landParcelSearchService,
  landParcelListService,
  landSubdivisionApplicationService,
  landUseChangeApplicationService,
  allLandParcelsService,
  landParcelCountService,
  getParcelDataService,
};