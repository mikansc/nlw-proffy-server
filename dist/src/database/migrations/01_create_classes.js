"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
async function up(knex) {
    return knex.schema.createTable('classes', (table) => {
        table.increments('id').primary();
        table.string('subject').notNullable();
        table.decimal('cost').notNullable();
        // criar relacionamento com outra tabela
        // onUpdate('CASCADE') atualiza as aulas se o ID for atualizado no professor
        // onDelete('CASCADE') deleta as aulas junto com o professor
        table
            .integer('user_id')
            .notNullable()
            .references('id')
            .inTable('users')
            .onUpdate('CASCADE')
            .onDelete('CASCADE');
    });
}
exports.up = up;
async function down(knex) {
    return knex.schema.dropTable('classes');
}
exports.down = down;
