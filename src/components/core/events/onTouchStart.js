import { window, document } from 'ssr-window';
import $ from '../../../utils/dom';
import Utils from '../../../utils/utils';

/**
 * 总结：
 * 1. 如果animating为true且preventInteractionOnTransition为true，则直接退出
 * 2. 如果不是touchEvent，则判断which和button，如果这2个都不是左边鼠标，则直接退出
 * 3. 如果isTouched为true且isMoved也为true，则证明正在触摸滑动，则直接退出
 * 4. 如果noSwiping为true，且同时通过noSwipingSelector/noSwipingClass找到了父级元素，则阻止滑动
 * 5. 如果设置了swipeHandler，则如果没有找到则直接退出
 * 6. 如果设置了edgeSwipeDetection/iOSEdgeSwipeDetection, 且如果当前的startx在edgeSwipeThreshold/iOSEdgeSwipeDetection之内，则退出
 */
export default function (event) {
  const swiper = this;
  const data = swiper.touchEventsData;
  const { params, touches } = swiper;
  if (swiper.animating && params.preventInteractionOnTransition) {
    return;
  }
  let e = event;
  if (e.originalEvent) e = e.originalEvent;
  data.isTouchEvent = e.type === 'touchstart';
  if (!data.isTouchEvent && 'which' in e && e.which === 3) return;
  if (!data.isTouchEvent && 'button' in e && e.button > 0) return;
  if (data.isTouched && data.isMoved) return;
  if (params.noSwiping && $(e.target).closest(params.noSwipingSelector ? params.noSwipingSelector : `.${params.noSwipingClass}`)[0]) {
    // swiper.allowClick = true;
    return;
  }
  if (params.swipeHandler) {
    if (!$(e).closest(params.swipeHandler)[0]) return;
  }

  touches.currentX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
  touches.currentY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
  const startX = touches.currentX;
  const startY = touches.currentY;

  // Do NOT start if iOS edge swipe is detected. Otherwise iOS app (UIWebView) cannot swipe-to-go-back anymore

  const edgeSwipeDetection = params.edgeSwipeDetection || params.iOSEdgeSwipeDetection;
  const edgeSwipeThreshold = params.edgeSwipeThreshold || params.iOSEdgeSwipeThreshold;
  if (
    edgeSwipeDetection
    && ((startX <= edgeSwipeThreshold)
    || (startX >= window.screen.width - edgeSwipeThreshold))
  ) {
    return;
  }

  Utils.extend(data, {
    isTouched: true,
    isMoved: false,
    allowTouchCallbacks: true,
    isScrolling: undefined,
    startMoving: undefined,
  });

  touches.startX = startX;
  touches.startY = startY;
  data.touchStartTime = Utils.now();
  // swiper.allowClick = true;
  swiper.updateSize();
  swiper.swipeDirection = undefined;
  if (params.threshold > 0) data.allowThresholdMove = false;
  if (e.type !== 'touchstart') {
    let preventDefault = true;
    if ($(e.target).is(data.formElements)) preventDefault = false;
    if (
      document.activeElement
      && $(document.activeElement).is(data.formElements)
      && document.activeElement !== e.target
    ) {
      document.activeElement.blur();
    }

    const shouldPreventDefault = preventDefault && swiper.allowTouchMove && params.touchStartPreventDefault;
    if (params.touchStartForcePreventDefault || shouldPreventDefault) {
      e.preventDefault();
    }
  }
  swiper.emit('touchStart', e);
}
