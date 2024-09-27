import { useTranslation, Trans } from 'react-i18next'
import { PriceExceptions } from '../shared/price-exceptions'
import PremiumFeaturesLink from '../dashboard/premium-features-link'
import getMeta from '../../../../utils/meta'
import { useSubscriptionDashboardContext } from '../../context/subscription-dashboard-context'
import OLRow from '@/features/ui/components/ol/ol-row'
import OLCol from '@/features/ui/components/ol/ol-col'
import OLCard from '@/features/ui/components/ol/ol-card'
import OLNotification from '@/features/ui/components/ol/ol-notification'

function SuccessfulSubscription() {
  const { t } = useTranslation()
  const { personalSubscription: subscription } =
    useSubscriptionDashboardContext()
  const postCheckoutRedirect = getMeta('ol-postCheckoutRedirect')
  const { appName, adminEmail } = getMeta('ol-ExposedSettings')

  if (!subscription || !('recurly' in subscription)) return null

  return (
    <div className="container">
      <OLRow>
        <OLCol lg={{ span: 8, offset: 2 }}>
          <OLCard>
            <div className="page-header">
              <h2>{t('thanks_for_subscribing')}</h2>
            </div>
            <OLNotification
              type="success"
              content={
                <>
                  {subscription.recurly.trial_ends_at && (
                    <>
                      <p>
                        <Trans
                          i18nKey="next_payment_of_x_collectected_on_y"
                          values={{
                            paymentAmmount: subscription.recurly.displayPrice,
                            collectionDate:
                              subscription.recurly.nextPaymentDueAt,
                          }}
                          shouldUnescape
                          tOptions={{ interpolation: { escapeValue: true } }}
                          components={[<strong />, <strong />]} // eslint-disable-line react/jsx-key
                        />
                      </p>
                      <PriceExceptions subscription={subscription} />
                    </>
                  )}
                  <p>
                    {t('to_modify_your_subscription_go_to')}&nbsp;
                    <a href="/user/subscription" rel="noopener noreferrer">
                      {t('manage_subscription')}.
                    </a>
                  </p>
                </>
              }
            />
            {subscription.groupPlan && (
              <p>
                <a
                  href={`/manage/groups/${subscription._id}/members`}
                  className="btn btn-primary btn-large"
                >
                  {t('add_your_first_group_member_now')}
                </a>
              </p>
            )}
            <p>
              {t('thanks_for_subscribing_you_help_sl', {
                planName: subscription.plan.name,
              })}
            </p>
            <PremiumFeaturesLink />
            <p>
              {t('need_anything_contact_us_at')}&nbsp;
              <a href={`mailto:${adminEmail}`} rel="noopener noreferrer">
                {adminEmail}
              </a>
              .
            </p>
            <p>
              <Trans
                i18nKey="help_improve_overleaf_fill_out_this_survey"
                components={[
                  // eslint-disable-next-line react/jsx-key, jsx-a11y/anchor-has-content
                  <a
                    href="https://forms.gle/CdLNX9m6NLxkv1yr5"
                    target="_blank"
                    rel="noopener noreferrer"
                  />,
                ]}
              />
            </p>
            <p>
              {t('regards')},
              <br />
              The {appName} Team
            </p>
            <p>
              <a
                className="btn btn-primary"
                href={postCheckoutRedirect || '/project'}
                rel="noopener noreferrer"
              >
                &lt; {t('back_to_your_projects')}
              </a>
            </p>
          </OLCard>
        </OLCol>
      </OLRow>
    </div>
  )
}

export default SuccessfulSubscription
