FROM nginx:alpine

# Borramos la config por defecto y ponemos la nuestra
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Creamos la ruta exacta
RUN mkdir -p /usr/share/nginx/html/vm2/front

# Copiamos los archivos compilados (Nota la diagonal al final)
COPY dist/UNPAGradesWEB/browser/ /usr/share/nginx/html/vm2/front/

# AQUI ESTA LA MAGIA: Le damos permisos de lectura a los archivos
RUN chown -R nginx:nginx /usr/share/nginx/html/vm2/front && \
    chmod -R 755 /usr/share/nginx/html/vm2/front

EXPOSE 8082
CMD ["nginx", "-g", "daemon off;"]
