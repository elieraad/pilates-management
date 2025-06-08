"use client";

import { useState } from "react";
import { useStudio } from "@/lib/hooks/use-studio";
import { Studio } from "@/types/studio.types";
import Input from "../ui/input";
import Button from "../ui/button";

type ProfileFormProps = {
  initialData: Studio;
};

const ProfileForm = ({ initialData }: ProfileFormProps) => {
  const { useUpdateStudioProfileMutation } = useStudio();
  const updateProfile = useUpdateStudioProfileMutation();

  const [formData, setFormData] = useState({
    name: initialData.name || "",
    address: initialData.address || "",
    phone: initialData.phone || "",
    email: initialData.email || "",
    description: initialData.description || "",
    opening_hours: initialData.opening_hours || ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Studio name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updateProfile.mutateAsync({
        name: formData.name,
        address: formData.address,
        phone: formData.phone || undefined,
        description: formData.description || undefined,
        opening_hours: formData.opening_hours || undefined,
      });
    } catch (error) {
      console.error("Profile update error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Studio Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <Input
        label="Address"
        name="address"
        value={formData.address}
        onChange={handleChange}
        error={errors.address}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
      </div>

      <Input
        label="Opening Hours"
        name="opening_hours"
        placeholder="e.g. Mon-Fri: 6am-8pm, Sat-Sun: 8am-6pm"
        value={formData.opening_hours}
        onChange={handleChange}
      />

      <div>
        <label className="block text-sm text-gray-600 mb-1">Description</label>
        <textarea
          name="description"
          className="w-full p-2 border border-gray-200 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-olive-200"
          placeholder="A brief description of your studio..."
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" isLoading={updateProfile.isPending}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
