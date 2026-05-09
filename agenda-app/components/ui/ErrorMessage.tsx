interface ErrorMessageProps {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{message}</p>
  )
}
