import { Module } from '@nestjs/common'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'
import { ProductsRepository } from './products.repository'
import { DatabaseModule } from '../../database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}
