#define GL_GLEXT_PROTOTYPES why

#include<stdio.h>
#include<stdbool.h>
#include<stdlib.h>
#include<stdint.h>

#include <glib.h>
#include <gtk/gtk.h>
#include <gdk/gdkkeysyms.h>
#include <GL/gl.h>
#include <GL/glx.h>
#include <GL/glu.h>
#include <GL/glext.h>

#include "sys.h"

#include "shader.h"
const char* vshader = "#version 420\nout gl_PerVertex{vec4 gl_Position;};void main(){gl_Position=vec4(gl_VertexID%2*8-4,gl_VertexID/2*8-1,1,1);}";
#define CANVAS_WIDTH 1920
#define CANVAS_HEIGHT 1080
#define SCANLINE_SIZE 10

#define DEBUG_FRAG
// #define DEBUG_VERT
#define DEBUG_BUFFER_SIZE 4096
#define TIME_RENDER
#define SCISSORS

GLuint vao;
GLuint p;

bool rendered = false;
bool flipped = false;

GdkWindow* window;
#ifdef TIME_RENDER
GTimer* gtimer;
#endif

static gboolean check_escape(GtkWidget *widget, GdkEventKey *event)
{
	(void)widget;
	if (event->keyval == GDK_KEY_Escape) {
		SYS_exit_group(0);
		__builtin_unreachable();
	}

	return FALSE;
}

static void compile_shader()
{
	// compile shader

	char* samples = getenv("SAMPLES");
	if (samples == NULL) samples = "100";

	const char* shader_frag_list[] = {"#version 420\n#define SAMPLES ", samples, "\n", shader_frag};
	GLuint f = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 4, shader_frag_list);

#ifdef DEBUG_FRAG
	GLint ok;
	char error[DEBUG_BUFFER_SIZE];
	glGetProgramiv(f, GL_LINK_STATUS, &ok);
	glGetProgramInfoLog(f, DEBUG_BUFFER_SIZE, NULL, error);
	if(!ok) {
		printf(error);

		SYS_exit_group(-1);
		__builtin_unreachable();
	}
#endif

	GLuint v = glCreateShaderProgramv(GL_VERTEX_SHADER, 1, &vshader);

#ifdef DEBUG_VERT
	glGetProgramiv(v, GL_LINK_STATUS, &ok);
	glGetProgramInfoLog(v, DEBUG_BUFFER_SIZE, NULL, error);
	if(!ok) {
		printf(error);

		SYS_exit_group(-1);
		__builtin_unreachable();
	}
#endif

	// link shader
	glGenProgramPipelines(1, &p);
	glUseProgramStages(p, GL_VERTEX_SHADER_BIT, v);
	glUseProgramStages(p, GL_FRAGMENT_SHADER_BIT, f);
	glBindProgramPipeline(p);

	glGenVertexArrays(1, &vao);
	glBindVertexArray(vao);
}

static gboolean
on_render (GtkGLArea *glarea, GdkGLContext *context)
{
	(void)context;
	if (rendered || !(gdk_window_get_state(window) & GDK_WINDOW_STATE_FULLSCREEN)) return TRUE;
	if (!flipped) { gtk_gl_area_queue_render(glarea); flipped = true; return TRUE; }
	compile_shader();

	rendered = true;
	// glVertexAttrib1f(0, 0);

#ifdef SCISSORS
  glEnable(GL_SCISSOR_TEST);
  for (int i = 0; i < CANVAS_HEIGHT; i += SCANLINE_SIZE) {
	  glScissor(0,i,CANVAS_WIDTH,SCANLINE_SIZE);
#endif
		glDrawArrays(GL_TRIANGLE_STRIP, 0, 3);
#ifdef SCISSORS
		glFinish();
		while (gtk_events_pending()) gtk_main_iteration();
  }
#else
	glFinish();
#endif

#ifdef TIME_RENDER
  printf("render time: %f\n", g_timer_elapsed(gtimer, NULL));
#endif
  return TRUE;
}
__attribute__((__externally_visible__, __section__(".text.startup._start"), __noreturn__))
void _start() {
	asm volatile("push %rax\n");
#ifdef TIME_RENDER
	gtimer = g_timer_new();
#endif

	typedef void (*voidWithOneParam)(int*);
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wcast-function-type"
	voidWithOneParam gtk_init_one_param = (voidWithOneParam)gtk_init;
#pragma GCC diagnostic pop
	(*gtk_init_one_param)(NULL);

	GtkWidget *win = gtk_window_new (GTK_WINDOW_TOPLEVEL);
	GtkWidget *glarea = gtk_gl_area_new();
	gtk_container_add(GTK_CONTAINER(win), glarea);

	g_signal_connect(win, "destroy", &&quit_asm, NULL);
	g_signal_connect(win, "key_press_event", G_CALLBACK(check_escape), NULL);
	// g_signal_connect(glarea, "realize", G_CALLBACK(on_realize), NULL);
	g_signal_connect(glarea, "render", G_CALLBACK(on_render), NULL);

	gtk_widget_show_all (win);

	gtk_window_fullscreen((GtkWindow*)win);
	window = gtk_widget_get_window(win);
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
	GdkCursor* Cursor = gdk_cursor_new(GDK_BLANK_CURSOR);
#pragma GCC diagnostic pop
	gdk_window_set_cursor(window, Cursor);

	gtk_main();

quit_asm:
	SYS_exit_group(0);
	__builtin_unreachable();
}