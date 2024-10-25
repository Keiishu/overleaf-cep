import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import ReactDOM from 'react-dom'
import MaterialIcon from '@/shared/components/material-icon'
import { useTranslation } from 'react-i18next'
import {
  useCodeMirrorStateContext,
  useCodeMirrorViewContext,
} from '@/features/source-editor/components/codemirror-context'
import {
  buildAddNewCommentRangeEffect,
  reviewTooltipStateField,
} from '@/features/source-editor/extensions/review-tooltip'
import { getTooltip } from '@codemirror/view'
import useViewerPermissions from '@/shared/hooks/use-viewer-permissions'
import usePreviousValue from '@/shared/hooks/use-previous-value'
import { useLayoutContext } from '@/shared/context/layout-context'
import { useReviewPanelViewActionsContext } from '../context/review-panel-view-context'
import {
  useRangesActionsContext,
  useRangesContext,
} from '../context/ranges-context'
import { isInsertOperation } from '@/utils/operations'

const ReviewTooltipMenu: FC = () => {
  const state = useCodeMirrorStateContext()
  const view = useCodeMirrorViewContext()
  const isViewer = useViewerPermissions()
  const [show, setShow] = useState(true)

  const tooltipState = state.field(reviewTooltipStateField, false)?.tooltip
  const previousTooltipState = usePreviousValue(tooltipState)

  useEffect(() => {
    if (tooltipState !== null && previousTooltipState === null) {
      setShow(true)
    }
  }, [tooltipState, previousTooltipState])

  if (isViewer || !show || !tooltipState) {
    return null
  }

  const tooltipView = getTooltip(view, tooltipState)

  if (!tooltipView) {
    return null
  }

  return ReactDOM.createPortal(
    <ReviewTooltipMenuContent setShow={setShow} />,
    tooltipView.dom
  )
}

const ReviewTooltipMenuContent: FC<{
  setShow: Dispatch<SetStateAction<boolean>>
}> = ({ setShow }) => {
  const { t } = useTranslation()
  const view = useCodeMirrorViewContext()
  const state = useCodeMirrorStateContext()
  const { setReviewPanelOpen } = useLayoutContext()
  const { setView } = useReviewPanelViewActionsContext()
  const ranges = useRangesContext()
  const { acceptChanges, rejectChanges } = useRangesActionsContext()

  const addComment = useCallback(() => {
    setReviewPanelOpen(true)
    setView('cur_file')

    view.dispatch({
      effects: buildAddNewCommentRangeEffect(state.selection.main),
    })
    setShow(false)
  }, [setReviewPanelOpen, setView, setShow, view, state.selection.main])

  useEffect(() => {
    window.addEventListener('add-new-review-comment', addComment)
    return () => {
      window.removeEventListener('add-new-review-comment', addComment)
    }
  }, [addComment])

  const changeIdsInSelection = useMemo(() => {
    return (ranges?.changes ?? [])
      .filter(({ op }) => {
        const opFrom = op.p
        const opLength = isInsertOperation(op) ? op.i.length : 0
        const opTo = opFrom + opLength
        const selection = state.selection.main
        return opFrom >= selection.from && opTo <= selection.to
      })
      .map(({ id }) => id)
  }, [ranges, state.selection.main])

  const acceptChangesHandler = useCallback(() => {
    acceptChanges(...changeIdsInSelection)
  }, [acceptChanges, changeIdsInSelection])

  const rejectChangesHandler = useCallback(() => {
    rejectChanges(...changeIdsInSelection)
  }, [rejectChanges, changeIdsInSelection])

  const showChangesButtons = changeIdsInSelection.length > 0

  return (
    <div className="review-tooltip-menu">
      <button
        className="review-tooltip-menu-button review-tooltip-add-comment-button"
        onClick={addComment}
      >
        <MaterialIcon type="chat" />
        {t('add_comment')}
      </button>
      {showChangesButtons && (
        <>
          <div className="review-tooltip-menu-divider" />
          <button
            className="review-tooltip-menu-button"
            onClick={acceptChangesHandler}
          >
            <MaterialIcon type="check" />
          </button>
          <button
            className="review-tooltip-menu-button"
            onClick={rejectChangesHandler}
          >
            <MaterialIcon type="clear" />
          </button>
        </>
      )}
    </div>
  )
}

export default ReviewTooltipMenu
