import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  title?: string
  message?: string
  actionUrl?: string
  actionLabel?: string
}

const Email = ({
  title = 'בין השמשות',
  message = 'יש לך עדכון חדש מהמשפחה.',
  actionUrl,
  actionLabel = 'פתיחת האפליקציה',
}: Props) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>{title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>בין השמשות 🕯️</Text>
        </Section>
        <Heading style={heading}>{title}</Heading>
        <Text style={text}>{message}</Text>
        {actionUrl ? (
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={actionUrl} style={button}>
              {actionLabel}
            </Button>
          </Section>
        ) : null}
        <Text style={footer}>שבת שלום ומבורך 🤍</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => data?.title || 'עדכון מבין השמשות',
  displayName: 'התראה כללית',
  previewData: {
    title: 'תזכורת הדלקת נרות',
    message: 'הדלקת נרות היום בשעה 19:24. שבת שלום!',
    actionUrl: 'https://ben-hashmashot.lovable.app',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, "Helvetica Neue", sans-serif',
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 28px',
}
const header = { textAlign: 'center' as const, marginBottom: '12px' }
const brand = {
  fontSize: '20px',
  fontWeight: 'bold' as const,
  color: '#c2641f',
  margin: '0',
}
const heading = {
  fontSize: '22px',
  color: '#3b2412',
  margin: '12px 0',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4a3a2c',
  textAlign: 'center' as const,
}
const button = {
  backgroundColor: '#c2641f',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  padding: '12px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
}
const footer = {
  fontSize: '14px',
  color: '#9a8674',
  textAlign: 'center' as const,
  marginTop: '24px',
}
