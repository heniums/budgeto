export interface FormAlertProps {
  message: string | null | undefined;
  id?: string;
}

export function FormAlert({ message, id }: FormAlertProps): JSX.Element | null {
  if (!message) return null;
  return (
    <div
      id={id}
      role="alert"
      className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}
