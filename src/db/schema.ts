import { integer, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  type: text('type', { enum: ['scale', 'text', 'multiple_choice'] }).notNull(),
  options: text('options').array(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const responses = pgTable('responses', {
  id: serial('id').primaryKey(),
  submission_id: uuid('submission_id').notNull(),
  question_id: integer('question_id').references(() => questions.id),
  response: text('response').notNull(),
  instagram: text('instagram'),
  phone_number: text('phone_number'),
  created_at: timestamp('created_at').defaultNow(),
}); 