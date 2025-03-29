"use client";

import { useState } from "react";
import { useClasses } from "@/lib/hooks/use-classes";
import { Class } from "@/types/class.types";
import Input from "../ui/input";
import Button from "../ui/button";

type ClassFormProps = {
  initialData?: Class;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const ClassForm = ({ initialData, onSuccess, onCancel }: ClassFormProps) => {
  const { useCreateClassMutation, useUpdateClassMutation } = useClasses();
  const createClass = useCreateClassMutation();
  const updateClass = useUpdateClassMutation();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    duration: initialData?.duration || 60,
    capacity: initialData?.capacity || 10,
    price: initialData?.price || 25,
    instructor: initialData?.instructor || "",
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
      newErrors.name = "Class name is required";
    }

    if (!formData.instructor.trim()) {
      newErrors.instructor = "Instructor name is required";
    }

    if (formData.duration <= 0) {
      newErrors.duration = "Duration must be greater than 0";
    }

    if (formData.capacity <= 0) {
      newErrors.capacity = "Capacity must be greater than 0";
    }

    if (formData.price < 0) {
      newErrors.price = "Price cannot be negative";
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
      if (initialData) {
        // Update existing class
        await updateClass.mutateAsync({
          id: initialData.id,
          ...formData,
          duration: Number(formData.duration),
          capacity: Number(formData.capacity),
          price: Number(formData.price),
        });
      } else {
        // Create new class
        await createClass.mutateAsync({
          ...formData,
          duration: Number(formData.duration),
          capacity: Number(formData.capacity),
          price: Number(formData.price),
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isLoading = createClass.isPending || updateClass.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Class Name"
        name="name"
        placeholder="e.g. Reformer Flow"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <div>
        <label className="block text-sm text-gray-600 mb-1">Description</label>
        <textarea
          name="description"
          className="w-full p-2 border border-gray-200 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-olive-200"
          placeholder="Describe the class format, level, and what clients should expect..."
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Duration (minutes)"
          name="duration"
          type="number"
          placeholder="e.g. 60"
          value={formData.duration}
          onChange={handleChange}
          error={errors.duration}
          required
        />

        <Input
          label="Price ($)"
          name="price"
          type="number"
          step="0.01"
          placeholder="e.g. 25"
          value={formData.price}
          onChange={handleChange}
          error={errors.price}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Instructor"
          name="instructor"
          placeholder="e.g. Emma Wilson"
          value={formData.instructor}
          onChange={handleChange}
          error={errors.instructor}
          required
        />

        <Input
          label="Capacity"
          name="capacity"
          type="number"
          placeholder="e.g. 10"
          value={formData.capacity}
          onChange={handleChange}
          error={errors.capacity}
          required
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? "Update Class" : "Create Class"}
        </Button>
      </div>
    </form>
  );
};

export default ClassForm;
