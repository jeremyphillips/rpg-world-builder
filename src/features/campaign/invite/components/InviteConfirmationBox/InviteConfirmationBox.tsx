import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FormProvider, useForm } from 'react-hook-form'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'

import GroupIcon from '@mui/icons-material/Group'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

import { DynamicFormRenderer } from '@/ui/patterns'
import type { FieldConfig } from '@/ui/patterns'
import { AppAlert } from '@/ui/primitives'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InviteConfirmationBoxProps {
  /** Primary heading shown at the top of the card (e.g. "Campaign Invite", "Session Invite") */
  headline: string
  /** Secondary text rendered below the headline */
  invitedByLabel?: string
  /** Optional description rendered above the subtitle card */
  description?: ReactNode
  /** Optional subtitle rendered above the detail card */
  subtitle?: ReactNode
  /** Rendered in the detail preview area (e.g. CampaignHorizontalCard) */
  campaignCard?: ReactNode
  /** Invite status */
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  /** Whether an accept/decline request is in flight */
  responding?: boolean
  /** Called when the user clicks Accept or Decline */
  onRespond?: (action: 'accept' | 'decline') => void
  /** Form field configs rendered via DynamicFormRenderer when pending */
  formFields?: FieldConfig[]
  /** Default values for the form fields */
  formDefaultValues?: Record<string, unknown>
  /** Called whenever a form value changes */
  onFormValuesChange?: (values: Record<string, unknown>) => void
  /** Link shown in the accepted alert (e.g. navigate to campaign) */
  acceptedLink?: { to: string; label: string }
  /** Accepted alert message */
  acceptedMessage?: string
  /** Declined alert message */
  declinedMessage?: string
  /** Footer text (e.g. date sent) */
  footer?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const InviteConfirmationBox = ({
  headline,
  invitedByLabel,
  description,
  subtitle,
  campaignCard,
  status,
  responding = false,
  onRespond,
  formFields,
  formDefaultValues,
  onFormValuesChange,
  acceptedLink,
  acceptedMessage = 'You have accepted this invite!',
  declinedMessage = 'You have declined this invite.',
  footer,
}: InviteConfirmationBoxProps) => {
  const isPending = status === 'pending'
  const isAccepted = status === 'accepted'
  const isDeclined = status === 'declined'

  const methods = useForm({ defaultValues: formDefaultValues })

  // Sync form values to parent whenever they change
  useEffect(() => {
    if (!onFormValuesChange) return
    const sub = methods.watch((values) =>
      onFormValuesChange(values as Record<string, unknown>),
    )
    return () => sub.unsubscribe()
  }, [methods, onFormValuesChange])

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', mt: 4 }}>
      <Card variant="outlined">
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
            <GroupIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {headline}
              </Typography>
              {invitedByLabel && (
                <Typography variant="body2" color="text.secondary">
                  {invitedByLabel}
                </Typography>
              )}
            </Box>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Description — rendered above subtitle */}
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {description}
            </Typography>
          )}

          {/* Subtitle — rendered above the detail card */}
          {subtitle && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              {subtitle}
            </Typography>
          )}

          {/* Campaign detail card */}
          {campaignCard && <Box sx={{ mb: 3 }}>{campaignCard}</Box>}

          {/* Form fields — rendered when pending */}
          {isPending && formFields && formFields.length > 0 && (
            <FormProvider {...methods}>
              <Box sx={{ mb: 3 }}>
                <DynamicFormRenderer fields={formFields} />
              </Box>
            </FormProvider>
          )}

          {/* Status / Actions */}
          {isPending && onRespond && (
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => onRespond('decline')}
                disabled={responding}
              >
                Decline
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircleIcon />}
                onClick={() => onRespond('accept')}
                disabled={responding}
              >
                {responding ? 'Processing…' : 'Accept Invite'}
              </Button>
            </Stack>
          )}

          {isAccepted && (
            <AppAlert
              tone="success"
              action={
                acceptedLink ? (
                  <Button
                    component={Link}
                    to={acceptedLink.to}
                    color="inherit"
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                  >
                    {acceptedLink.label}
                  </Button>
                ) : undefined
              }
            >
              {acceptedMessage}
            </AppAlert>
          )}

          {isDeclined && (
            <AppAlert tone="info">{declinedMessage}</AppAlert>
          )}

          {status === 'expired' && (
            <AppAlert tone="warning">This invite has expired.</AppAlert>
          )}

          {/* Footer */}
          {footer && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'right' }}>
              {footer}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default InviteConfirmationBox
