export function getValidationErrors(metadata: any): string[] {
  const errors: string[] = [];
  if (typeof metadata !== "object" || metadata === null) {
    errors.push("Metadata must be an object");
    return errors;
  }
  const { name, description, participants, timestamp } = metadata;
  if (typeof name !== "string" || name.length < 3 || name.length > 50) {
    errors.push("Name must be 3-50 characters");
  }
  if (typeof description !== "string" || description.length < 10 || description.length > 500) {
    errors.push("Description must be 10-500 characters");
  }
  if (!Array.isArray(participants) || participants.length === 0) {
    errors.push("Participants must be a non-empty array");
  }
  if (typeof timestamp !== "number" || isNaN(new Date(timestamp).getTime())) {
    errors.push("Timestamp must be a valid date timestamp");
  }
  return errors;
}