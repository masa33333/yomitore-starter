// src/lib/routes.ts
import routesData from '@/data/routes.json'
import type { RoutePoint } from '@/lib/types'

export const getRoutePoints = (): RoutePoint[] => {
  return routesData as RoutePoint[]
}
