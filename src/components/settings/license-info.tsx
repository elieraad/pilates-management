"use client";

import { useState } from "react";
import { useStudio } from "@/lib/hooks/use-studio";
import Button from "../ui/button";
import Modal from "../ui/modal";
import { formatDate } from "@/lib/utils/date-utils";

const LicenseInfo = () => {
  const { useLicenseStatusQuery, useLicensesQuery, useRenewLicenseMutation } =
    useStudio();
  const licenseStatus = useLicenseStatusQuery();
  const licenses = useLicensesQuery();
  const renewLicense = useRenewLicenseMutation();

  const [showRenewModal, setShowRenewModal] = useState(false);
  const [licenseType, setLicenseType] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [paymentReference, setPaymentReference] = useState("");

  const handleRenewLicense = async () => {
    try {
      await renewLicense.mutateAsync({
        license_type: licenseType,
        payment_reference: paymentReference || undefined,
      });
      setShowRenewModal(false);
    } catch (error) {
      console.error("License renewal error:", error);
    }
  };

  const isLoading = licenseStatus.isLoading || licenses.isLoading;
  const isActive = licenseStatus.data?.active;

  return (
    <div>
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading license information...</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-olive-800 mb-4">
              License Status
            </h3>

            {isActive ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="h-4 w-4 rounded-full bg-green-500 mr-2" />
                  <span className="font-medium text-green-700">
                    Active License
                  </span>
                </div>
                <p className="mt-2 text-sm text-green-600">
                  Your {licenseStatus.data?.license?.type} license is active and
                  will expire on{" "}
                  {formatDate(licenseStatus.data?.license?.expiresAt || "")}.
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setShowRenewModal(true)}
                >
                  Renew License
                </Button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="h-4 w-4 rounded-full bg-amber-500 mr-2" />
                  <span className="font-medium text-amber-700">
                    No Active License
                  </span>
                </div>
                <p className="mt-2 text-sm text-amber-600">
                  {`You don't have an active license. Please renew your license to
                  access all features.`}
                </p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => setShowRenewModal(true)}
                >
                  Purchase License
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-olive-800 mb-4">
              License History
            </h3>

            {licenses.data && licenses.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm border-b">
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Start Date</th>
                      <th className="pb-2">End Date</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Payment Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.data.map((license) => (
                      <tr key={license.id} className="border-b border-gray-100">
                        <td className="py-3 font-medium">
                          {license.license_type.charAt(0).toUpperCase() +
                            license.license_type.slice(1)}
                        </td>
                        <td className="py-3 text-gray-600">
                          {formatDate(license.start_date)}
                        </td>
                        <td className="py-3 text-gray-600">
                          {formatDate(license.end_date)}
                        </td>
                        <td className="py-3">
                          {license.is_active ? (
                            <span className="text-green-600 font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="text-gray-500">Expired</span>
                          )}
                        </td>
                        <td className="py-3 text-gray-600">
                          {license.payment_reference || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 py-4 text-center">
                No license history found
              </p>
            )}
          </div>
        </>
      )}

      {/* Renew License Modal */}
      <Modal
        isOpen={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        title="Renew License"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              License Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-4 border rounded-lg cursor-pointer text-center ${
                  licenseType === "monthly"
                    ? "border-olive-600 bg-olive-50 text-olive-800"
                    : "border-gray-200 text-gray-700"
                }`}
                onClick={() => setLicenseType("monthly")}
              >
                <div className="font-medium">Monthly</div>
                <div className="text-sm mt-1">$29.99/month</div>
              </div>
              <div
                className={`p-4 border rounded-lg cursor-pointer text-center ${
                  licenseType === "yearly"
                    ? "border-olive-600 bg-olive-50 text-olive-800"
                    : "border-gray-200 text-gray-700"
                }`}
                onClick={() => setLicenseType("yearly")}
              >
                <div className="font-medium">
                  Yearly <span className="text-xs text-olive-600">20% OFF</span>
                </div>
                <div className="text-sm mt-1">$287.90/year</div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Payment Reference (optional)
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-200"
              placeholder="For your record keeping"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 border border-blue-100">
            <p>
              In a production environment, this would integrate with a payment
              processor.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowRenewModal(false)}
              disabled={renewLicense.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={renewLicense.isPending}
              onClick={handleRenewLicense}
            >
              {isActive ? "Renew License" : "Purchase License"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LicenseInfo;
