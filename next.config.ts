import type { NextConfig } from 'next'
import { withWorkflow } from '@workflow/next'

const nextConfig: NextConfig = {
  experimental: {
    dynamicIO: true,
  },
}

export default withWorkflow(nextConfig)
