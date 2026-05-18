import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [FormsModule, QuillEditorComponent],
  templateUrl: './rich-text-editor.html',
  styleUrl: './rich-text-editor.css',
})
export class RichTextEditorComponent {
  readonly value = model.required<string>();
  readonly placeholder = model('Write your adventure here…');

  protected readonly quillModules = {
    toolbar: [
      [{ header: [2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'link'],
      ['clean'],
    ],
  };
}
