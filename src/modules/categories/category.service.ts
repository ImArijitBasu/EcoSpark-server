import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CreateCategoryInput, UpdateCategoryInput } from './category.schema';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export class CategoryService {
  async getAll() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { ideas: true },
        },
      },
    });
  }

  async create(data: CreateCategoryInput) {
    const slug = slugify(data.name);

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: data.name }, { slug }] },
    });

    if (existing) {
      throw new AppError('A category with this name already exists', 409);
    }

    return prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        icon: data.icon,
        miniImage: data.miniImage,
        bannerImage: data.bannerImage,
      },
    });
  }

  async update(id: string, data: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const updateData: any = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name);
    }

    return prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { ideas: true } } },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (category._count.ideas > 0) {
      throw new AppError(
        'Cannot delete category with existing ideas. Reassign ideas first.',
        400
      );
    }

    return prisma.category.delete({ where: { id } });
  }
}

export const categoryService = new CategoryService();
