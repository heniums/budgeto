export interface FormErrorProps {
  message: string | null | undefined;
  id?: string;
}

export function FormError({ message, id }: FormErrorProps): JSX.Element | null {
  if (!message) return null;
  return (
    <span id={id} role="alert" className="text-sm text-destructive">
      {message}
    </span>
  );
}
