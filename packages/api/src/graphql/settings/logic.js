/**
 * Business logic for managing site information.
 */
const SiteInfo = require("../../models/SiteInfo.js");
const {
  checkIfAuthenticated,
  checkPermission,
} = require("../../lib/graphql.js");
const { responses } = require("../../config/strings.js");
const { currencyISOCodes, permissions } = require("../../config/constants.js");
const {
  checkForInvalidPaymentMethod,
  checkForInvalidPaymentSettings,
  getPaymentInvalidException,
} = require("./helpers.js");

exports.getSiteInfo = async (ctx) => {
  const siteinfo = await SiteInfo.findOne(
    { domain: ctx.subdomain._id },
    "title subtitle logopath currencyUnit currencyISOCode paymentMethod stripePublishableKey themePrimaryColor themeSecondaryColor codeInjectionHead"
  );

  return siteinfo;
};

exports.getSiteInfoAsAdmin = async (ctx) => {
  checkIfAuthenticated(ctx);

  if (!checkPermission(ctx.user.permissions, [permissions.manageSettings])) {
    throw new Error(responses.action_not_allowed);
  }

  const siteinfo = await SiteInfo.findOne({ domain: ctx.subdomain._id });
  return siteinfo;
};

exports.updateSiteInfo = async (siteData, ctx) => {
  checkIfAuthenticated(ctx);

  if (!checkPermission(ctx.user.permissions, [permissions.manageSettings])) {
    throw new Error(responses.action_not_allowed);
  }

  let siteInfo = await SiteInfo.findOne({ domain: ctx.subdomain._id });

  let shouldCreate = false;
  if (siteInfo === null) {
    shouldCreate = true;
    siteInfo = {
      domain: ctx.subdomain._id,
    };
  }

  if (shouldCreate) {
    siteInfo = await SiteInfo.create(siteInfo);
  } else {
    siteInfo = await siteInfo.save();
  }

  return siteInfo;
};

exports.updatePaymentInfo = async (siteData, ctx) => {
  checkIfAuthenticated(ctx);

  if (!checkPermission(ctx.user.permissions, [permissions.manageSettings])) {
    throw new Error(responses.action_not_allowed);
  }

  let siteInfo = await SiteInfo.findOne({ domain: ctx.subdomain._id });

  if (!siteInfo) {
    throw new Error(responses.branding_info_not_set)
  }

  for (const key of Object.keys(siteData)) {
    siteInfo[key] = siteData[key];
  }
  siteInfo.currencyISOCode = siteData.currencyISOCode.toLowerCase();

  const invalidPaymentMethod = checkForInvalidPaymentMethod(siteInfo);
  if (invalidPaymentMethod) {
    throw invalidPaymentMethod;
  }

  const failedPaymentMethod = checkForInvalidPaymentSettings(siteInfo);
  if (failedPaymentMethod) {
    throw getPaymentInvalidException(failedPaymentMethod);
  }
}
