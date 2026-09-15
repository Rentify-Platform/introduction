// RTL yêu cầu môi trường act
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// jsdom không có ResizeObserver — @base-ui/react (floating-ui) cần nó khi mount popup
class ResizeObserverStub {
   observe(): void {}
   unobserve(): void {}
   disconnect(): void {}
}
;(globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub
