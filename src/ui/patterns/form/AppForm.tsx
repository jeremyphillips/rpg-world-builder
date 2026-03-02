import { FormProvider, useForm, type DefaultValues, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { Stack } from '@mui/material'

type AppFormProps<T extends FieldValues> = {
  defaultValues: DefaultValues<T>
  onSubmit: (data: T) => void
  /** Accepts a static ReactNode or a render-prop receiving the form methods. */
  children: React.ReactNode | ((methods: UseFormReturn<T>) => React.ReactNode)
  spacing?: number
  /** HTML id applied to the <form> element, enabling external submit buttons via form={id}. */
  id?: string
}

export default function AppForm<T extends FieldValues>({
  defaultValues,
  onSubmit,
  children,
  spacing = 3,
  id,
}: AppFormProps<T>) {
  const methods = useForm<T>({
    defaultValues,
    mode: 'onBlur'
  })

  return (
    <FormProvider {...methods}>
      <form id={id} onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing={spacing}>
          {typeof children === 'function' ? children(methods) : children}
        </Stack>
      </form>
    </FormProvider>
  )
}
