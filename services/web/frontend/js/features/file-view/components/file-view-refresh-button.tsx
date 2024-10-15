import {
  type Dispatch,
  type SetStateAction,
  type ElementType,
  useCallback,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '@/shared/components/icon'
import { postJSON } from '@/infrastructure/fetch-json'
import { useProjectContext } from '@/shared/context/project-context'
import useAbortController from '@/shared/hooks/use-abort-controller'
import type { BinaryFile } from '../types/binary-file'
import { Nullable } from '../../../../../types/utils'
import importOverleafModules from '../../../../macros/import-overleaf-module.macro'
import OLButton from '@/features/ui/components/ol/ol-button'

type FileViewRefreshButtonProps = {
  setRefreshError: Dispatch<SetStateAction<Nullable<string>>>
  file: BinaryFile
}

const tprFileViewRefreshButton = importOverleafModules(
  'tprFileViewRefreshButton'
) as {
  import: { TPRFileViewRefreshButton: ElementType }
  path: string
}[]

export default function FileViewRefreshButton({
  setRefreshError,
  file,
}: FileViewRefreshButtonProps) {
  const { _id: projectId } = useProjectContext()
  const { signal } = useAbortController()
  const [refreshing, setRefreshing] = useState(false)

  const refreshFile = useCallback(
    (isTPR: Nullable<boolean>) => {
      setRefreshing(true)
      // Replacement of the file handled by the file tree
      window.expectingLinkedFileRefreshedSocketFor = file.name
      const body = {
        shouldReindexReferences: isTPR || /\.bib$/.test(file.name),
      }
      postJSON(`/project/${projectId}/linked_file/${file.id}/refresh`, {
        signal,
        body,
      })
        .then(() => {
          setRefreshing(false)
        })
        .catch(err => {
          setRefreshing(false)
          setRefreshError(err.data?.message || err.message)
        })
    },
    [file, projectId, signal, setRefreshError]
  )

  if (tprFileViewRefreshButton.length > 0) {
    return tprFileViewRefreshButton.map(
      ({ import: { TPRFileViewRefreshButton }, path }) => (
        <TPRFileViewRefreshButton
          key={path}
          file={file}
          refreshFile={refreshFile}
          refreshing={refreshing}
        />
      )
    )[0]
  } else {
    return (
      <FileViewRefreshButtonDefault
        refreshFile={refreshFile}
        refreshing={refreshing}
      />
    )
  }
}

type FileViewRefreshButtonDefaultProps = {
  refreshFile: (isTPR: Nullable<boolean>) => void
  refreshing: boolean
}

function FileViewRefreshButtonDefault({
  refreshFile,
  refreshing,
}: FileViewRefreshButtonDefaultProps) {
  const { t } = useTranslation()

  return (
    <OLButton
      variant="primary"
      onClick={() => refreshFile(null)}
      disabled={refreshing}
      isLoading={refreshing}
      bs3Props={{
        loading: (
          <>
            <Icon type="refresh" spin={refreshing} fw />{' '}
            <span>{refreshing ? `${t('refreshing')}…` : t('refresh')}</span>
          </>
        ),
      }}
    >
      {t('refresh')}
    </OLButton>
  )
}
