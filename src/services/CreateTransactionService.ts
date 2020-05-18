import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction type is invalid');
    }

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You dot not have enough balance');
    }

    let checkCategoryExists = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!checkCategoryExists) {
      checkCategoryExists = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(checkCategoryExists);
    }

    const checkTransactionExist = await transactionsRepository.findOne({
      where: {
        title,
      },
    });

    if (checkTransactionExist) {
      throw new AppError('Transaction already exists');
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: checkCategoryExists,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
