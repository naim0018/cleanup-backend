import { Controller, Get } from '@nestjs/common';

@Controller('')
export class RootController {
  @Get()
  getRoot() {
    return {
      status: 'success',
      message: 'Malware Cleanup Backend is running successfully!',
      timestamp: new Date().toISOString(),
    };
  }
}
