begin;

-- A criação e a edição estrutural de turmas passam a ser responsabilidade
-- exclusiva da direção pela área administrativa. Professores continuam
-- acessando somente as turmas às quais estão vinculados.
revoke execute on function public.create_teacher_class(text, text, text, integer)
  from authenticated;
revoke execute on function public.update_teacher_class(uuid, text, text, text, integer, boolean)
  from authenticated;

commit;
